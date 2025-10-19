const express = require("express");
const router = express.Router();

const doctorRoutes = require("./doctorRoutes");
const nurseRoutes = require("./nurseRoutes");
const {
  getUserById,
  getUsersByRole,
} = require("../controllers/UserController");
const authMiddleware = require("../middleware/authMiddleware");
const { auditInterceptor } = require("../interceptors/auditInterceptor");

router.use(authMiddleware);
router.use(auditInterceptor);

router.get("/by-role", getUsersByRole);
router.get("/:userId", getUserById);
router.use("/doctors", doctorRoutes);
router.use("/nurses", nurseRoutes);

module.exports = router;
