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
const { auditInterceptor } = require("../interceptors/auditInterceptor");

// Definir rutas
router.post(
  "/sign-up",
  authMiddleware,
  auditInterceptor,
  isAdminMiddleware,
  signUp,
);
router.post("/sign-in", auditInterceptor, signIn);
router.post("/verify-email", auditInterceptor, verifyEmail);
router.post(
  "/resend-verification-code",
  auditInterceptor,
  resendVerificationCode,
);

module.exports = router;
