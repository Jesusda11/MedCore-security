const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { generateVerificationCode, sendVerificationEmail } = require('../config/emailConfig');
const { generateAccessToken, generateRefreshToken } = require("../config/jwtConfig");
const { createUserBase } = require("../services/userService");


const signUp = async (req, res) => {
  try {
    const user = await createUserBase(req.body);

    res.status(201).json({
      message: "Usuario registrado correctamente. Verifique su cuenta al iniciar sesión.",
      user: { id: user.id, email: user.email, status: user.status }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
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