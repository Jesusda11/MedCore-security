const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

/**
 * Lista todas las especialidades.
 */
const listEspecialidades = async () => {
  try {
    const especialidades = await prisma.especializacion.findMany({
      include: {
        departamento: { select: { id: true, nombre: true } },
      },
      orderBy: { nombre: "asc" },
    });

    return especialidades;
  } catch (error) {
    console.error("Error al listar especialidades (service):", error);
    throw error;
  }
};

/**
 * Lista especialidades filtradas por departamento.
 * Debes enviar al menos departamentoId o departamentoNombre.
 */
const listEspecialidadesByDepartamento = async ({
  departamentoId = null,
  departamentoNombre = null,
  page = 1,
  limit = 20,
}) => {
  try {
    if (!departamentoId && !departamentoNombre) {
      const err = new Error("Debe enviar departamentoId o departamentoNombre");
      err.status = 400;
      throw err;
    }

    if (!departamentoId && departamentoNombre) {
      const dept = await prisma.departamento.findFirst({
        where: { nombre: departamentoNombre },
        select: { id: true, nombre: true },
      });

      if (!dept) {
        const err = new Error("Departamento no encontrado");
        err.status = 404;
        throw err;
      }

      departamentoId = dept.id;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const especialidades = await prisma.especializacion.findMany({
      where: { departamentoId },
      include: {
        departamento: { select: { id: true, nombre: true } },
      },
      orderBy: { nombre: "asc" },
      skip,
      take,
    });

    const total = await prisma.especializacion.count({
      where: { departamentoId },
    });
    const totalPages = Math.ceil(total / take);

    return { total, totalPages, especialidades };
  } catch (error) {
    console.error("Error filtrando especialidades por departamento (service):", error);
    throw error;
  }
};

module.exports = {
  listEspecialidades,
  listEspecialidadesByDepartamento,
};
