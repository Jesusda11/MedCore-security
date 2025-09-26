// src/router/authRoutes.js
const express = require("express");
const router = express.Router();

const { signUp, signIn, verifyEmail, resendVerificationCode } = require("../controllers/AuthController");

// Definir rutas
router.post("/sign-up", signUp);
router.post("/sign-in", signIn);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification-code", resendVerificationCode);

module.exports = router;
