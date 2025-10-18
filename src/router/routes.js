const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const adminRoutes = require("./adminRoutes");
const pacientesRoutes = require("./pacientesRoutes");

const router = express.Router();

router.use("/pacientes", pacientesRoutes);

router.use("/auth", authRoutes);

router.use("/admin", adminRoutes);
module.exports = router;
