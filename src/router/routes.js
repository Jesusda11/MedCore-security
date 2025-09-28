const express = require("express")
const router = express.Router()
const authRoutes = require("./AuthRoutes")
const userRoutes = require("./userRoutes")
const adminRoutes = require("./adminRoutes")
//Login, Register, Logout para rutas de autenticacion

router.use("/auth", authRoutes)
//router.use("/users", userRoutes
router.use("/admin", adminRoutes)   
module.exports = router;