const { listEspecialidades } = require("../services/especialidadService");

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

module.exports = { getEspecialidades };
