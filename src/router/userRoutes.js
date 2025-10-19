const express = require("express");
const router = express.Router();

const doctorRoutes = require("./doctorRoutes");
const nurseRoutes = require("./nurseRoutes");
const { getUserById, getUsersByRole } = require("../controllers/UserController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/by-role" , authMiddleware, getUsersByRole);
router.get("/:userId", getUserById);
router.use("/doctors", doctorRoutes);
router.use("/nurses", nurseRoutes);

module.exports = router;
