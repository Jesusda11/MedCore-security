const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.get("/profile", authMiddleware(), (req, res) => {
  res.json({ message: "Bienvenido a tu perfil", user: req.user });
});

// Solo Admin puede entrar
router.get("/admin", authMiddleware(["ADMIN"]), (req, res) => {
  res.json({ message: "Ruta exclusiva para admins" });
});

module.exports = router;
