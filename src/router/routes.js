const express = require("express")
const router = express.Router()
const authRoutes = require("./authRoutes")
const userRoutes = require("./userRoutes")

//Login, Register, Logout para rutas de autenticacion

//Rutas de usaurios en general
//crear usuario listar y todo eso
//NO es buena practica crear un unico archivo de rutas, cada archivo se encarga de una cosa
//asi que authRoutes se encarga de las rutas de autenticacion y userRoutes de las rutas de usuarios

router.use("/auth", authRoutes)
//router.use("/users", userRoutes)
module.exports = router;