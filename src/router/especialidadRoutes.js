const express = require("express");
const router = express.Router();
const { getEspecialidades, listByDepartamento, removeEspecialidad } = require("../controllers/especialidadController");

router.get("/", getEspecialidades);
router.get("/by-department", listByDepartamento);
router.delete("/:id", removeEspecialidad);

module.exports = router;
