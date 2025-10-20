const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const listEspecialidades = async () => {
  try {
    const especialidades = await prisma.especializacion.findMany({
      include: {
        departamento: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: {
        nombre: "asc",
      },
    });

    return especialidades;
  } catch (error) {
    console.error("Error al listar especialidades (service):", error);
    throw error;
  }
};

module.exports = { listEspecialidades };
