const express = require("express");
const router = express.Router();
const pacienteController = require("../controllers/pacienteController");
const isAdminMiddleware = require("../middleware/adminMiddleware");

router.get("/", pacienteController.getAllPatients);
router.get("/:id", pacienteController.getPatientById);
router.post("/", pacienteController.createPatient);
router.put("/:id", pacienteController.updatePatient);
router.patch("/:id/state",isAdminMiddleware, pacienteController.updatePatientState,
);

module.exports = router;
