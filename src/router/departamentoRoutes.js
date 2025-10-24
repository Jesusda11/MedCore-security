const express = require("express");
const { getDepartamentos, removeDepartamento } = require("../controllers/departamentoController");

const router = express.Router();

router.get("/", getDepartamentos);
router.delete("/:id", removeDepartamento);

module.exports = router;
