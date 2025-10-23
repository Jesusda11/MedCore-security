const express = require("express");
const router = express.Router();

const doctorRoutes = require("./doctorRoutes");
const nurseRoutes = require("./nurseRoutes");
const pacientesRoutes = require("./pacientesRoutes");
const {
  getUserById,
  getUsersByRole,
  getUsersByRoleAndStatus,
  getUsersBySearch,
  updateUserByRole,
  getUsersBySearchAndRole,
  deleteUsersByRole
} = require("../controllers/UserController");
const authMiddleware = require("../middleware/authMiddleware");
const { auditInterceptor } = require("../interceptors/auditInterceptor");

router.use(authMiddleware);
router.use(auditInterceptor);
router.use("/doctors", doctorRoutes);
router.use("/nurses", nurseRoutes);
router.use("/patients", pacientesRoutes);


router.get("/by-role-status", getUsersByRoleAndStatus);
router.get("/by-role", authMiddleware, getUsersByRole);
router.get("/search", getUsersBySearch);
router.get("/search-by-role", getUsersBySearchAndRole);
router.delete("/by-role/:role", deleteUsersByRole);

router.get("/:id", getUserById);
router.put("/:id", authMiddleware, updateUserByRole);

module.exports = router;