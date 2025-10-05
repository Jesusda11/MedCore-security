const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
//Para envio de correos electronicos
const nodemailer = require('nodemailer');
const { generateVerificationCode, sendVerificationEmail } = require('../config/emailConfig');
const { generateAccessToken, generateRefreshToken } = require("../config/jwtConfig");


const signUp = async (req, res) => {
  try {
    let { 
      email, 
      current_password, 
      fullname, 
      role, 
      departamento, 
      especializacion, 
      phone, 
      date_of_birth 
    } = req.body;

    if (!email || !current_password || !fullname || !date_of_birth) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    email = email.toLowerCase().trim();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "El email no es válido" });
    }

    if (current_password.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/;
    if (!passwordRegex.test(current_password)) {
      return res.status(400).json({ message: "La contraseña debe tener al menos una letra y un número" });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date_of_birth)) {
      return res.status(400).json({ message: "La fecha de nacimiento debe tener el formato YYYY-MM-DD" });
    }

    const parsedDate = new Date(date_of_birth);
    if (isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
      return res.status(400).json({ message: "La fecha de nacimiento no es válida" });
    }

    const age = calcularEdad(parsedDate);

    if (age < 0 || age > 100) {
      return res.status(400).json({ message: "La edad debe estar entre 0 y 100 años" });
    }

    // Validar que el email no exista
    const userExist = await prisma.users.findUnique({ where: { email } });
    if (userExist) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const userCount = await prisma.users.count();

    // Determinar rol
    if (userCount === 0) {
      role = "ADMINISTRADOR";
    } else {
      const allowedRoles = ["ADMINISTRADOR", "MEDICO", "ENFERMERA", "PACIENTE"];
      if (!role || !allowedRoles.includes(role.toUpperCase())) {
        role = "PACIENTE";
      } else {
        role = role.toUpperCase();
      }
    }

    // Departamento
    let departamentoId = null;
    if (departamento) {
      let dept = await prisma.departamento.findUnique({ where: { nombre: departamento } });
      if (!dept) {
        dept = await prisma.departamento.create({ data: { nombre: departamento } });
      }
      departamentoId = dept.id;
    }

    // Especialización
    let especializacionId = null;
    if (especializacion) {
      if (!["MEDICO", "ENFERMERA"].includes(role)) {
        return res.status(400).json({ message: "Solo los médicos o enfermeras pueden tener especialización" });
      }
      if (!departamentoId) {
        return res.status(400).json({ message: "Debe especificar un departamento para la especialización" });
      }
      let esp = await prisma.especializacion.findFirst({
        where: { nombre: especializacion, departamentoId }
      });
      if (!esp) {
        esp = await prisma.especializacion.create({
          data: { nombre: especializacion, departamentoId }
        });
      }
      especializacionId = esp.id;
    }

    // Determinar quién está creando al usuario
    let creatorId = null;

    if (req.user && req.user.id) {
      creatorId = req.user.id;
    }

    const createdUser = await prisma.users.create({
      data: {
        email,
        current_password: await bcrypt.hash(current_password, 10),
        fullname,
        role,
        status: "PENDING",
        departamentoId,
        especializacionId,
        phone: phone || null,
        date_of_birth: parsedDate,
        createdById: creatorId,
        updatedById: creatorId
      }
    });

    return res.status(201).json({
      message: "Usuario creado correctamente. Debe iniciar sesión para verificar su cuenta.",
      user: {
        id: createdUser.id,
        email: createdUser.email,
        fullname: createdUser.fullname,
        status: createdUser.status,
        role: createdUser.role,
        departamentoId,
        especializacionId,
        phone: createdUser.phone,
        date_of_birth: createdUser.date_of_birth,
        createdById: createdUser.createdById,
        updatedById: createdUser.updatedById,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt
      }
    });

  } catch (error) {
    console.error("Error en signUp:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const verifyEmail = async (req, res) => {
    try {
        const { email, verificationCode } = req.body;

        if (!email || !verificationCode) {
            return res.status(400).json({
                message: "Email y código de verificación son requeridos",
            });
        }

        // Buscar usuario por email
        const user = await prisma.users.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        if (user.status === "ACTIVE") {
            return res.status(400).json({ message: "La cuenta ya está verificada" });
        }

        // Verificar si el código ha expirado
        if (new Date() > user.verificationCodeExpires) {
            return res.status(400).json({
                message: "El código de verificación ha expirado",
            });
        }

        // Verificar el código
        if (user.verificationCode !== verificationCode) {
            return res.status(400).json({
                message: "Código de verificación incorrecto",
            });
        }

        // Generar tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Activar la cuenta y guardar el refresh token
        const updatedUser = await prisma.users.update({
            where: { id: user.id },
            data: {
                status: "ACTIVE",
                verificationCode: null,
                verificationCodeExpires: null,
                refreshToken,
            },
        });

        return res.status(200).json({
            message: "Email verificado exitosamente. Tu cuenta está ahora activa.",
            accessToken,
            refreshToken,
        });
    } catch (error) {
        console.error("Error en verifyEmail:", error);
        return res.status(500).json({
            message: "Error interno del servidor",
        });
    }
};

const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email es requerido" });
        }

        const user = await prisma.users.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        if (user.status === "ACTIVE") {
            return res.status(400).json({ message: "La cuenta ya está verificada" });
        }

        // Generar nuevo código
        const verificationCode = generateVerificationCode();
        const verificationExpires = new Date();
        verificationExpires.setMinutes(verificationExpires.getMinutes() + 15);

        // Actualizar usuario con nuevo código
        await prisma.users.update({
            where: { id: user.id },
            data: {
                verificationCode,
                verificationCodeExpires: verificationExpires,
            },
        });

        // Enviar nuevo email
        const emailResult = await sendVerificationEmail(
            email,
            user.fullname,
            verificationCode
        );

        if (!emailResult.success) {
            return res.status(500).json({
                message: "Error enviando email de verificación",
            });
        }

        return res.status(200).json({
            message: "Nuevo código de verificación enviado a tu email",
        });

    } catch (error) {
        console.error("Error en resendVerificationCode:", error);
        return res.status(500).json({
            message: "Error interno del servidor",
        });
    }
};

const signIn = async (req, res) => {
  try {
    const { email, current_password } = req.body;

    if (!email || !current_password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }

    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(current_password, user.current_password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    if (user.status === "PENDING") {
      const verificationCode = generateVerificationCode();
      const verificationExpires = new Date();
      verificationExpires.setMinutes(verificationExpires.getMinutes() + 10);

      await prisma.users.update({
        where: { id: user.id },
        data: {
          verificationCode,
          verificationCodeExpires: verificationExpires,
        },
      });

      const emailResult = await sendVerificationEmail(
        user.email,
        user.fullname,
        verificationCode
      );

      if (!emailResult.success) {
        return res.status(500).json({ message: "Error enviando email de verificación" });
      }

      return res.status(200).json({
        message: "Código de verificación enviado al email. Debes verificar para iniciar sesión.",
        step: "VERIFY_LOGIN"
      });
    }

    if (user.status === "ACTIVE") {
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      await prisma.users.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      return res.status(200).json({
        message: "Login exitoso",
        accessToken,
        refreshToken,
      });
    }

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Función para calcular edad automáticamente
function calcularEdad(dateOfBirth) {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

module.exports = {signUp, signIn, verifyEmail, resendVerificationCode};