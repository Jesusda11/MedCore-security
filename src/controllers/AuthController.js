//Permite la conexion a la base de datos
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
//permite encriptar las contraseñas
const bcrypt = require('bcrypt');
//permite crear y verificar tokens al momento de iniciar sesion
const jwt = require('jsonwebtoken');
//Para envio de correos electronicos
const nodemailer = require('nodemailer');
const { generateVerificationCode, sendVerificationEmail } = require('../config/emailConfig');
const { generateAccessToken, generateRefreshToken } = require("../config/jwtConfig");


const signUp = async (req, res) => {
    try {
        let { email, current_password, fullname } = req.body;

        // Validar datos obligatorios
        if (!email || !current_password || !fullname) {
            return res.status(400).json({ message: "Faltan datos obligatorios" });
        }

        // Normalizar email
        email = email.toLowerCase().trim();

        // Validar formato de email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "El email no es válido" });
        }

        // Validar contraseña mínima
        if (current_password.length < 6) {
            return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
        }

        // Validar contraseña con al menos 1 letra y 1 número
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/;
        if (!passwordRegex.test(current_password)) {
            return res.status(400).json({ message: "La contraseña debe tener al menos una letra y un número" });
        }

        // Validar que el email no exista
        const UserExist = await prisma.users.findUnique({ where: { email } });
        if (UserExist) {
            return res.status(400).json({ message: "El correo ya está registrado" });
        }

        // Generar código de verificación y expiración
        const verificationCode = generateVerificationCode();
        const verificationExpires = new Date();
        verificationExpires.setMinutes(verificationExpires.getMinutes() + 15);

        const userCount = await prisma.users.count();

        let role = "PATIENT"; // por defecto
        if (userCount === 0) {
            role = "administrador";
        }
        // Crear usuario en estado PENDING
        const createdUser = await prisma.users.create({
            data: {
                email,
                current_password: await bcrypt.hash(current_password, 10),
                fullname,
                role,
                status: "PENDING",
                verificationCode,
                verificationCodeExpires: verificationExpires
            }
        });

        // Enviar correo de verificación
        const emailResult = await sendVerificationEmail(email, fullname, verificationCode);

        if (!emailResult.success) {
            return res.status(500).json({ message: "Error enviando correo de verificación" });
        }

        return res.status(201).json({
            message: "Usuario creado correctamente. Verifica tu correo.",
            user: {
                id: createdUser.id,
                email: createdUser.email,
                fullname: createdUser.fullname,
                status: createdUser.status
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

        // Activar la cuenta
        const updatedUser = await prisma.users.update({
            where: { id: user.id },
            data: {
                status: "ACTIVE",
                verificationCode: null,
                verificationCodeExpires: null,
            },
        });

        return res.status(200).json({
            message: "Email verificado exitosamente. Tu cuenta está ahora activa.",
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                fullname: updatedUser.fullname,
                status: updatedUser.status,
            },
        });
    } catch (error) {
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

    // Validar campos
    if (!email || !current_password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }

    // Buscar usuario
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Validar que esté activo
    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "Cuenta no verificada" });
    }

    // Comparar contraseña
    const isMatch = await bcrypt.compare(current_password, user.current_password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Generar tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Guardar refresh token en DB (opcional)
    await prisma.users.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.status(200).json({
      message: "Login exitoso",
      accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};


module.exports = {signUp, signIn, verifyEmail, resendVerificationCode};