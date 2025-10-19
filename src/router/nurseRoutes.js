const express = require("express");
const router = express.Router();

const { registerNurse, getNurseById, updateNurse, toggleNurseStatus } = require("../controllers/nurseController");
const authMiddleware = require("../middleware/authMiddleware");
const isAdminMiddleware = require("../middleware/adminMiddleware");

router.post("/", authMiddleware, isAdminMiddleware, registerNurse);
router.get("/:id", authMiddleware, getNurseById);
router.put("/:id", authMiddleware, isAdminMiddleware, updateNurse);
router.patch("/status/:id", authMiddleware, isAdminMiddleware, toggleNurseStatus);

module.exports = router;
