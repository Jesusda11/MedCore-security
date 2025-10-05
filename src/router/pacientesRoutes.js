const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const authMiddleware = require("../middleware/authMiddleware");
const isAdminMiddleware = require("../middleware/adminMiddleware");

router.get('/', authMiddleware, pacienteController.getAllPatients);
router.get('/:id', authMiddleware, pacienteController.getPatientById);
router.put('/:id', authMiddleware, pacienteController.updatePatient);
router.patch('/:id/state', authMiddleware, isAdminMiddleware, pacienteController.updatePatientState);

module.exports = router;
