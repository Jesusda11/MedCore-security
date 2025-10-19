const express = require("express");
const router = express.Router();

const {
  registerNurse,
  getNurseById,
  updateNurse,
  toggleNurseStatus,
} = require("../controllers/nurseController");
const isAdminMiddleware = require("../middleware/adminMiddleware");

router.post("/", isAdminMiddleware, registerNurse);
router.get("/:id", getNurseById);
router.put("/:id", isAdminMiddleware, updateNurse);
router.patch("/status/:id", isAdminMiddleware, toggleNurseStatus);

module.exports = router;
