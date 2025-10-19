const express = require("express");
const router = express.Router();
const { getUsersByRole, getDoctorsBySpecialty } = require("../controllers/UserController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/by-specialty", authMiddleware, getDoctorsBySpecialty);
router.get("/by-role",  authMiddleware, getUsersByRole);

module.exports = router;

