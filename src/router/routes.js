const express = require("express")
const router = express.Router()
const authRoutes = require("./authRoutes")
const userRoutes = require("./userRoutes")
const adminRoutes = require("./adminRoutes")
const pacientesRoutes = require("./pacientesRoutes");
const doctorRoutes = require("./doctorRoutes");
const nurseRoutes = require("./nurseRoutes");

router.use("/pacientes", pacientesRoutes);

router.use("/auth", authRoutes)

router.use("/admin", adminRoutes)   

router.use("/doctors", doctorRoutes);

router.use("/nurses", nurseRoutes);
module.exports = router;