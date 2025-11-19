const express = require("express");
const router = express.Router();

const {
  registerDoctor,
  getDoctorById,
  updateDoctor,
  updatePausedStatus,
  toggleDoctorStatus,
  getDoctorsBySpecialty,
} = require("../controllers/doctorController");
const isAdminMiddleware = require("../middleware/adminMiddleware");

router.get("/by-specialty", getDoctorsBySpecialty);
router.post("/", isAdminMiddleware, registerDoctor);
router.get("/:id", getDoctorById);
router.put("/:id", isAdminMiddleware, updateDoctor);
router.put("/:id/paused", updatePausedStatus);
router.patch("/status/:id", isAdminMiddleware, toggleDoctorStatus);

module.exports = router;
