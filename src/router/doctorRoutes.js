const express = require("express");
const router = express.Router();

const doctorController = require("../controllers/doctorController");
const authMiddleware = require("../middleware/authMiddleware");
const isAdminMiddleware = require("../middleware/adminMiddleware");


router.post("/", authMiddleware, isAdminMiddleware, doctorController.registerDoctor);

module.exports = router;
