const express = require("express")
const router = express.Router()
const authRoutes = require("./AuthRoutes")
const userRoutes = require("./userRoutes")
const adminRoutes = require("./adminRoutes")
const pacientesRoutes = require("./pacientesRoutes");

router.use("/pacientes", pacientesRoutes);

router.use("/auth", authRoutes)

router.use("/admin", adminRoutes)   
module.exports = router;