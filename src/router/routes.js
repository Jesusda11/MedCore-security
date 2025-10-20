const express = require("express");

const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const userRoutes = require("./userRoutes");
const especialidadRoutes = require("./especialidadRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/users", userRoutes);
router.use("/specialties", especialidadRoutes);

module.exports = router;
