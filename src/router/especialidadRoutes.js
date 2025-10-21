const express = require("express");
const router = express.Router();
const { getEspecialidades, listByDepartamento } = require("../controllers/especialidadController");

router.get("/", getEspecialidades);
router.get("/by-department", listByDepartamento);

module.exports = router;
