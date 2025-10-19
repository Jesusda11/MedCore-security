const express = require("express");
const router = express.Router();

const { registerDoctor, getDoctorById, updateDoctor, toggleDoctorStatus, getDoctorsBySpecialty } = require("../controllers/doctorController");
const authMiddleware = require("../middleware/authMiddleware");
const isAdminMiddleware = require("../middleware/adminMiddleware");

router.get("/by-specialty", authMiddleware, getDoctorsBySpecialty);
router.post("/", authMiddleware, isAdminMiddleware, registerDoctor);
router.get("/:id", authMiddleware, getDoctorById);
router.put("/:id", authMiddleware, isAdminMiddleware, updateDoctor);
router.patch("/status/:id", authMiddleware, isAdminMiddleware, toggleDoctorStatus);

module.exports = router;
