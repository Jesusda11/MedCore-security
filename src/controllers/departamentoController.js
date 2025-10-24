const { listDepartamentos, deleteDepartamento } = require("../services/departamentoService");

/**
 * Controlador para obtener todos los departamentos.
 */
const getDepartamentos = async (req, res) => {
  try {
    const departamentos = await listDepartamentos();

    return res.status(200).json({
      message: "Departamentos listados correctamente",
      data: departamentos,
    });
  } catch (error) {
    console.error("Error al listar departamentos (controller):", error);
    return res.status(500).json({
      message: "Error al listar departamentos",
      error: error.message,
    });
  }
};

const removeDepartamento = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await deleteDepartamento(id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar el departamento",
      error: error.message,
    });
  }
};

module.exports = { getDepartamentos, removeDepartamento };
