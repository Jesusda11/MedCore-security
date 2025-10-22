const { listEspecialidades, listEspecialidadesByDepartamento } = require("../services/especialidadService");

const getEspecialidades = async (req, res) => {
  try {
    const especialidades = await listEspecialidades();

    if (!especialidades.length) {
      return res.status(404).json({
        message: "No se encontraron especialidades registradas",
      });
    }

    return res.status(200).json({
      total: especialidades.length,
      especialidades,
    });
  } catch (error) {
    console.error("Error al listar especialidades:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

const listByDepartamento = async (req, res) => {
  try {
    const { departamentoId, departamentoNombre, page = 1, limit = 50 } = req.query;

    const result = await listEspecialidadesByDepartamento({
      departamentoId,
      departamentoNombre,
      page,
      limit,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Controller - listByDepartamento error:", error);

    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = { getEspecialidades, listByDepartamento};
