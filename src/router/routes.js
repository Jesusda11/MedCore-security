const express = require("express");

const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const userRoutes = require("./userRoutes");
const especialidadRoutes = require("./especialidadRoutes");
const departamentoRoutes = require("./departamentoRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/users", userRoutes);
router.use("/specialties", especialidadRoutes);
router.use("/departments", departamentoRoutes);

module.exports = router;
