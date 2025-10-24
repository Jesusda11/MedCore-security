const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

/**
 * Lista todos los departamentos.
 */
const listDepartamentos = async () => {
  try {
    const departamentos = await prisma.departamento.findMany({
      orderBy: { nombre: "asc" },
    });

    return departamentos;
  } catch (error) {
    console.error("Error al listar departamentos (service):", error);
    throw error;
  }
};

/**
 * Elimina un departamento y maneja las relaciones manualmente.
 */
const deleteDepartamento = async (id) => {
  try {
    const departamento = await prisma.departamento.findUnique({
      where: { id },
      include: { especializaciones: true, users: true },
    });

    if (!departamento) {
      throw new Error("El departamento no existe");
    }

    await prisma.especializacion.deleteMany({
      where: { departamentoId: id },
    });

    await prisma.users.updateMany({
      where: { departamentoId: id },
      data: { departamentoId: null },
    });

    await prisma.departamento.delete({
      where: { id },
    });

    return { message: "Departamento y relaciones eliminadas correctamente" };
  } catch (error) {
    console.error("Error al eliminar departamento:", error);
    throw error;
  }
};
module.exports = { listDepartamentos, deleteDepartamento };
