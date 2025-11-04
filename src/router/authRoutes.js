// src/router/authRoutes.js
const express = require("express");
const router = express.Router();

const {
  signUp,
  signIn,
  verifyEmail,
  resendVerificationCode,
} = require("../controllers/AuthController");
const authMiddleware = require("../middleware/authMiddleware");
const isAdminMiddleware = require("../middleware/adminMiddleware");

// Definir rutas
router.post("/sign-up", authMiddleware, isAdminMiddleware, signUp);
router.post("/sign-in", signIn);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification-code", resendVerificationCode);

module.exports = router;
