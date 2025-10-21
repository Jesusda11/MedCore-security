const express = require("express");
const router = express.Router();

const doctorRoutes = require("./doctorRoutes");
const nurseRoutes = require("./nurseRoutes");
const { getUserById, getUsersByRole, getUsersByRoleAndStatus, getUsersBySearch, updateUserByRole, getUsersBySearchAndRole} = require("../controllers/UserController");
const authMiddleware = require("../middleware/authMiddleware");
const { auditInterceptor } = require("../interceptors/auditInterceptor");

router.get("/search-by-role", getUsersBySearchAndRole);
router.get("/by-role" , authMiddleware, getUsersByRole);
router.get("/by-role-status", getUsersByRoleAndStatus);
router.get("/search", getUsersBySearch);
router.use(authMiddleware);
router.use(auditInterceptor);

router.get("/:userId", getUserById);
router.put("/:id", authMiddleware, updateUserByRole);   
router.use("/doctors", doctorRoutes);
router.use("/nurses", nurseRoutes);

module.exports = router;
