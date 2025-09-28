// src/controllers/adminController.js
const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const csvParser = require("csv-parser");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

/**
 * Detecta delimitador más probable en una línea (header)
 */
function detectDelimiter(line) {
  if (!line) return ",";
  const comma = (line.match(/,/g) || []).length;
  const semicolon = (line.match(/;/g) || []).length;
  const tab = (line.match(/\t/g) || []).length;
  if (tab > comma && tab > semicolon) return "\t";
  if (semicolon > comma) return ";";
  return ",";
}

/**
 * Normaliza claves del CSV: espacios -> _, guiones -> _, minúsculas.
 * También deja valores vacíos como null y trim.
 */
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

/**
 * Función principal: importa usuarios desde el CSV path
 * Devuelve { total, errors }
 */
async function importUsersFromCSV(filePath) {
  try {
    let raw = fs.readFileSync(filePath, "utf8");
    raw = raw.replace(/^\uFEFF/, "");
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return { total: 0, errors: ["Archivo vacío"] };
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

    const rows = [];
    await new Promise((resolve, reject) => {
      stream
        .pipe(
          csvParser({
            separator: delimiter,
            mapHeaders: ({ header }) => header.trim().replace(/\uFEFF/g, ""),
            strict: false,
            trim: true,
          })
        )
        .on("data", (row) => {
          const keys = Object.keys(row);
          if (keys.length === 1 && keys[0].includes(delimiter) && row[keys[0]] && row[keys[0]].includes(delimiter)) {
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

    //Normalizar y procesar filas -> insertar en DB
    const errors = [];
    let total = 0;

    for (const originalRow of rows) {
      const row = normalizeRowKeysAndValues(originalRow);

      const email = row.email;
      const fullname = row.fullname;
      const role = row.role ? row.role.toString().trim().toUpperCase() : null;
      const current_password = row.current_password || row["current-password"] || row.password || null;
      const status = row.status || "PENDING";
      const specialization = row.specialization || row.especializacion || null;
      const department = row.department || row.departamento || null;
      const license_number = row.license_number || row.license || null;
      const phone = row.phone || null;
      const date_of_birth = row.date_of_birth || null;

      if (!email || !fullname || !role || !current_password) {
        errors.push(`Fila inválida: ${JSON.stringify(originalRow)}`);
        continue;
      }

      try {
        const hashed = await bcrypt.hash(current_password, 10);

        // crear o buscar departamento
        let departamentoId = null;
        if (department) {
          const depTrim = department.trim();
          let dep = await prisma.departamento.findUnique({ where: { nombre: depTrim } });
          if (!dep) {
            dep = await prisma.departamento.create({ data: { nombre: depTrim } });
          }
          departamentoId = dep.id;
        }

        // crear o buscar especializacion, vinculada a departamento si hay departamentoId
        let especializacionId = null;
        if (specialization) {
          const specTrim = specialization.trim();
          let spec = null;
          if (departamentoId) {
            spec = await prisma.especializacion.findFirst({
              where: { nombre: specTrim, departamentoId: departamentoId },
            });
          }
          if (!spec) {
            const createData = { nombre: specTrim };
            if (departamentoId) createData.departamentoId = departamentoId;
            spec = await prisma.especializacion.create({ data: createData });
          }
          especializacionId = spec.id;
        }

        // crear usuario
        await prisma.users.create({
          data: {
            email: email.toLowerCase().trim(),
            fullname: fullname.trim(),
            current_password: hashed,
            status: status.trim(),
            role: role, 
            license_number: license_number ? license_number.trim() : null,
            phone: phone ? phone.trim() : null,
            date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
            departamentoId: departamentoId,
            especializacionId: especializacionId,
          },
        });

        total++;
      } catch (err) {
        console.error("Error creando fila:", originalRow, err.message || err);
        errors.push(`Fila inválida: ${JSON.stringify(originalRow)} - ${err.message || err}`);
      }
    }

    //remover archivo subido
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
      console.warn("No se pudo eliminar archivo temporal:", filePath, e.message);
    }

    return { total, errors };
  } catch (error) {
    throw error;
  }
}

module.exports = { importUsersFromCSV };
