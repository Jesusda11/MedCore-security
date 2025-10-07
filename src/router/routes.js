const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const adminRoutes = require("./adminRoutes");
const pacientesRoutes = require("./pacientesRoutes");
const { auditInterceptor } = require("../interceptors/auditInterceptor");

const router = express.Router();

// Interceptor audit for all routes
// router.use(auditInterceptor);

router.use("/pacientes", pacientesRoutes);

router.use("/auth", authRoutes);

router.use("/admin", adminRoutes);
module.exports = router;
