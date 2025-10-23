const fs = require("fs");
const { Readable } = require("stream");
const csvParser = require("csv-parser");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const { createDoctor } = require("./doctorService");
const { createUserWithDepartment } = require("./userDepartmentService");
const patientService = require("./patientService");
const { logInfo, logError, logWarning } = require("../utils/logger");

/* ---------- Helpers ---------- */

function detectDelimiter(line) {
  if (!line) return ",";
  const comma = (line.match(/,/g) || []).length;
  const semicolon = (line.match(/;/g) || []).length;
  const tab = (line.match(/\t/g) || []).length;
  if (tab > comma && tab > semicolon) return "\t";
  if (semicolon > comma) return ";";
  return ",";
}

function normalizeRowKeysAndValues(row) {
  const out = {};
  for (const rawKey of Object.keys(row)) {
    const value = row[rawKey];
    const key = rawKey
      .trim()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_")
      .toLowerCase();
    if (typeof value === "string") {
      const v = value.trim();
      out[key] = v === "" ? null : v;
    } else {
      out[key] = value == null ? null : value;
    }
  }
  return out;
}

function isValidEmail(email) {
  if (!email) return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
  return regex.test(email);
}

function isValidPassword(pw) {
  if (!pw || pw.length < 6) return false;
  const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/;
  return regex.test(pw);
}

function isValidDateIso(isoStr) {
  if (!isoStr) return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(isoStr)) return false;
  const parsed = new Date(isoStr);
  return !isNaN(parsed.getTime());
}

/* ---------- Main import function ---------- */

async function importUsersFromCSV(
  filePath,
  storedKey,
  buffer,
  creatorId,
  token,
) {
  try {
    // 1) Leer y limpiar archivo
    let raw;

    if (buffer) {
      raw = buffer.toString("utf8");
    } else if (filePath && fs.existsSync(filePath)) {
      raw = fs.readFileSync(filePath, "utf8");
    } else {
      throw new Error("No se proporcionó buffer ni ruta de archivo válida");
    }

    raw = raw.replace(/^\uFEFF/, "");
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return { inserted: 0, skipped: 0, errors: ["Archivo vacío"] };
    }

    const cleanedLines = lines.map((l) => {
      const t = l.trim();
      if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
        return t.slice(1, -1);
      }
      return l;
    });

    const cleanedCsv = cleanedLines.join("\n");
    const headerLine = cleanedLines[0] || "";
    const delimiter = detectDelimiter(headerLine);
    const stream = Readable.from([cleanedCsv]);

    // 2) Parsear CSV a filas
    const rows = [];
    await new Promise((resolve, reject) => {
      stream
        .pipe(
          csvParser({
            separator: delimiter,
            mapHeaders: ({ header }) => header.trim().replace(/\uFEFF/g, ""),
            strict: false,
            trim: true,
          }),
        )
        .on("data", (row) => {
          // Soporte para casos donde csv-parser no separó correctamente.
          const keys = Object.keys(row);
          if (
            keys.length === 1 &&
            keys[0].includes(delimiter) &&
            row[keys[0]] &&
            row[keys[0]].includes(delimiter)
          ) {
            const headerKeys = keys[0].split(delimiter).map((h) => h.trim());
            const values = row[keys[0]].split(delimiter).map((v) => v.trim());
            const parsed = {};
            headerKeys.forEach((hk, i) => {
              parsed[hk] = values[i] !== undefined ? values[i] : "";
            });
            rows.push(parsed);
          } else {
            rows.push(row);
          }
        })
        .on("end", () => resolve())
        .on("error", (err) => reject(err));
    });

    // 3) Preparar caches y checks previos
    const errors = [];
    let inserted = 0;
    let skipped = 0;
    const createdUsers = [];

    // Normalizar filas
    const normalizedRows = rows.map(normalizeRowKeysAndValues);

    // Recolectar todos los emails y license_numbers del CSV (para chequear contra DB de una sola consulta)
    const csvEmails = [];
    const csvIdentificaciones = [];
    const csvLicenseNumbers = [];
    normalizedRows.forEach((r) => {
      if (r.email) csvEmails.push(r.email.toLowerCase().trim());
      if (r.id) csvIdentificaciones.push(r.id.trim());
      if (r.license_number) csvLicenseNumbers.push(r.license_number.trim());
    });

    // Buscar en BD los emails y las identificaciones ya existentes
    const [existingUsersByEmail, existingUsersByIdentificacion] =
      await Promise.all([
        csvEmails.length
          ? prisma.users.findMany({
              where: { email: { in: csvEmails } },
              select: { email: true },
            })
          : [],
        csvIdentificaciones.length
          ? prisma.users.findMany({
              where: { identificacion: { in: csvIdentificaciones } },
              select: { identificacion: true },
            })
          : [],
      ]);

    const existingEmailsSet = new Set(
      existingUsersByEmail.map((u) => (u.email || "").toLowerCase()),
    );
    const existingIdentificacionesSet = new Set(
      existingUsersByIdentificacion.map((u) => (u.identificacion || "").trim()),
    );

    // Para detectar duplicados dentro del CSV
    const seenEmails = new Set();

    for (let i = 0; i < normalizedRows.length; i++) {
      function calcularEdad(dateOfBirth) {
        const today = new Date();
        let age = today.getFullYear() - dateOfBirth.getFullYear();
        const monthDiff = today.getMonth() - dateOfBirth.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
        ) {
          age--;
        }
        return age;
      }
      const originalRow = rows[i];
      const row = normalizedRows[i];

      // Campos comunes con normalización de nombre
      const idRaw = row.id || null;
      const emailRaw = row.email;
      const fullnameRaw = row.fullname || row.name || null;
      const roleRaw = row.role || null;
      const pwdRaw =
        row.current_password || row["current-password"] || row.password || null;
      const statusRaw = row.status || "PENDING";
      const specializationRaw =
        row.specialization || row.especializacion || null;
      const departmentRaw = row.department || row.departamento || null;
      const license_number_raw = row.license_number || row.license || null;
      const phoneRaw = row.phone || null;
      const dobRaw = row.date_of_birth || row.dob || null;

      const lineInfo = `Fila ${i + 2}`; // +2 asumiendo header en línea 1

      // Validaciones básicas
      if (!idRaw || !emailRaw || !fullnameRaw || !pwdRaw) {
        const logMsg = `${lineInfo}: faltan campos obligatorios (identificacion/email/fullname/password). Row: ${JSON.stringify(originalRow)}`;
        logError(logMsg);
        errors.push(logMsg);
        skipped++;
        continue;
      }

      const email = emailRaw.toLowerCase().trim();

      // Validar duplicado dentro del CSV
      if (idRaw) {
        const idTrim = idRaw.trim();
        if (seenEmails.has(idTrim)) {
          const logMsg = `${lineInfo}: identificacion duplicada en CSV (${idTrim})`;
          logError(logMsg);
          errors.push(logMsg);
          skipped++;
          continue;
        }

        if (existingIdentificacionesSet.has(idTrim)) {
          const logMsg = `${lineInfo}: identificacion ya existe en BD (${idTrim})`;
          logError(logMsg);
          errors.push(logMsg);
          skipped++;
          continue;
        }

        // Duplicado dentro del mismo CSV?
        if (seenEmails.has(email)) {
          const logMsg = `${lineInfo}: email duplicado en CSV (${email})`;
          logError(logMsg);
          errors.push(logMsg);
          skipped++;
          continue;
        }

        // Duplicado contra BD?
        if (existingEmailsSet.has(email)) {
          const logMsg = `${lineInfo}: email ya existe en BD (${email})`;
          logError(logMsg);
          errors.push(logMsg);
          skipped++;
          continue;
        }

        // Validar formato email y password
        if (!isValidEmail(email)) {
          const logMsg = `${lineInfo}: email inválido (${email})`;
          logError(logMsg);
          errors.push(logMsg);
          skipped++;
          continue;
        }

        if (!/^[0-9]{5,15}$/.test(idRaw)) {
          const logMsg = `${lineInfo}: identificación inválida (${idTrim}) - debe tener entre 5 y 15 caracteres y contener solo números`;
          logError(logMsg);
          errors.push(logMsg);
          skipped++;
          continue;
        }
      }

      // Validar role
      const allowedRoles = ["ADMINISTRADOR", "MEDICO", "ENFERMERA", "PACIENTE"];
      let role = roleRaw ? roleRaw.toString().trim().toUpperCase() : null;
      if (!role || !allowedRoles.includes(role)) {
        role = "PACIENTE";
      }

      // Validar date_of_birth si viene
      let parsedDob = null;
      if (dobRaw) {
        const dobStr = dobRaw.toString().trim();
        if (!isValidDateIso(dobStr)) {
          const logMsg = `${lineInfo}: date_of_birth inválida o en formato incorrecto (esperado YYYY-MM-DD): ${dobStr}`;
          logError(logMsg);
          errors.push(logMsg);
          skipped++;
          continue;
        }
        parsedDob = new Date(dobStr);
        if (parsedDob > new Date()) {
          const logMsg = `${lineInfo}: date_of_birth no puede ser futura: ${dobStr}`;
          logError(logMsg);
          errors.push(logMsg);
          skipped++;
          continue;
        }

        const age = calcularEdad(parsedDob);
        if (age < 0 || age > 100) {
          const logMsg = `${lineInfo}: edad fuera de rango (0–100 años) calculada = ${age}`;
          logError(logMsg);
          errors.push(logMsg);
          skipped++;
          continue;
        }
      }

      // Validar estado permitido
      const allowedStatuses = ["PENDING", "ACTIVE", "INACTIVE"];
      if (!allowedStatuses.includes(statusRaw.toUpperCase())) {
        const logMsg = `${lineInfo}: estado inválido (${statusRaw}), permitido: ${allowedStatuses.join(", ")}`;
        logError(logMsg);
        errors.push(logMsg);
        skipped++;
        continue;
      }

      // Hasear contraseña y crear usuario
      try {
        const hashed = await bcrypt.hash(pwdRaw.toString(), 10);

        const userData = {
          identificacion: idRaw ? idRaw.toString().trim() : null,
          email,
          fullname: fullnameRaw.toString().trim(),
          current_password: hashed,
          status: statusRaw ? statusRaw.toString().trim() : "PENDING",
          license_number: license_number_raw
            ? license_number_raw.toString().trim()
            : null,
          phone: phoneRaw ? phoneRaw.toString().trim() : null,
          date_of_birth: parsedDob,
        };

        const normalizedRole = role?.toUpperCase();

        if (normalizedRole === "MEDICO") {
          await createDoctor({
            especializacion: specializationRaw,
            departamento: departmentRaw,
            userData,
            creatorId,
          });
          logInfo(`Médico creado correctamente: ${email}`);
          createdUsers.push({
            identificacion: userData.identificacion,
            role: normalizedRole,
            status: userData.status,
            fullname: userData.fullname,
          });
        } else if (["ENFERMERA", "ADMINISTRADOR"].includes(normalizedRole)) {
          await createUserWithDepartment({
            departamento: departmentRaw,
            userData,
            creatorId,
            role: normalizedRole,
          });
          logInfo(`Usuario ${normalizedRole} creado correctamente: ${email}`);
          createdUsers.push({
            identificacion: userData.identificacion,
            role: normalizedRole,
            status: userData.status,
            fullname: userData.fullname,
          });
        } else if (normalizedRole === "PACIENTE") {
          const user = await prisma.users.create({
            data: {
              ...userData,
              role: normalizedRole,
              createdById: creatorId || null,
              updatedById: creatorId || null,
            },
          });

          await patientService.createPatient(user.id, token);
          logInfo(`Paciente creado correctamente: ${email}`);
          createdUsers.push({
            identificacion: userData.identificacion,
            role: normalizedRole,
            status: userData.status,
            fullname: userData.fullname,
          });
        }

        // marcar email como visto para evitar duplicados posteriores en el CSV
        seenEmails.add(email);
        // También anotar en existingEmailsSet para evitar re-check contra BD restante
        existingEmailsSet.add(email);

        if (idRaw) {
          existingIdentificacionesSet.add(idRaw.trim());
        }

        inserted++;
      } catch (err) {
        // Manejo de errores (ej. unique constraint race)
        const msg = err && err.message ? err.message : String(err);
        errors.push(`${lineInfo}: error creando usuario (${email}) - ${msg}`);
        skipped++;
      }
    }

    return { inserted, skipped, errors, createdUsers };
  } catch (error) {
    // Dejar que el caller lo capture si quiere
    throw error;
  }
}

module.exports = { importUsersFromCSV };
