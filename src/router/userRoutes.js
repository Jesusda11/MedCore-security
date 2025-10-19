const express = require("express");
const router = express.Router();

const doctorRoutes = require("./doctorRoutes");
const nurseRoutes = require("./nurseRoutes");
const { getUserById } = require("../controllers/UserController");

router.get("/:userId", getUserById);

router.use("/doctors", doctorRoutes);
router.use("/nurses", nurseRoutes);

module.exports = router;
