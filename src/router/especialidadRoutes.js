const express = require("express");
const router = express.Router();
const { getEspecialidades } = require("../controllers/especialidadController");

router.get("/", getEspecialidades);

module.exports = router;
