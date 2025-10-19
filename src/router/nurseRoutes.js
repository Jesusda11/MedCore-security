const express = require("express");
const router = express.Router();

const { registerNurse } = require("../controllers/nurseController");
const authMiddleware = require("../middleware/authMiddleware");
const isAdminMiddleware = require("../middleware/adminMiddleware");

router.post("/", authMiddleware, isAdminMiddleware, registerNurse);

module.exports = router;
