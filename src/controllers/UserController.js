const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const getUsersByRole = async (req, res) => {
  try {
    const { role, page = 1 } = req.query;

    if (!role) {
      return res.status(400).json({ message: "Debe especificar el parámetro 'role'" });
    }

    const validRoles = ["ADMINISTRADOR", "MEDICO", "ENFERMERA", "PACIENTE"];
    const normalizedRole = role.toUpperCase();

    if (!validRoles.includes(normalizedRole)) {
      return res.status(400).json({ message: "Rol no válido" });
    }

    const limit = 20;
    const skip = (parseInt(page) - 1) * limit;

    const total = await prisma.users.count({
      where: { role: normalizedRole, status: "ACTIVE" },
    });

    const users = await prisma.users.findMany({
      where: { role: normalizedRole, status: "ACTIVE" },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        departamento: { select: { nombre: true } },
        especializacion: { select: { nombre: true } },
      },
    });

    res.status(200).json({
      page: parseInt(page),
      total,
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    console.error("Error en getUsersByRole:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const getDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialty, page = 1 } = req.query;
    if (!specialty) return res.status(400).json({ message: "Debe especificar 'specialty'" });

    const limit = 20;
    const skip = (parseInt(page, 10) - 1) * limit;

    const especializaciones = await prisma.especializacion.findMany({
      where: { nombre: { equals: specialty, mode: "insensitive" } },
      select: { id: true, nombre: true, departamentoId: true },
    });

    if (!especializaciones || especializaciones.length === 0) {
      return res.status(404).json({ message: `No se encontró la especialidad '${specialty}'` });
    }

    const espIds = especializaciones.map(e => e.id);

    const total = await prisma.users.count({
      where: {
        role: "MEDICO",
        status: "ACTIVE",
        especializacionId: { in: espIds },
      },
    });

    const doctors = await prisma.users.findMany({
      where: {
        role: "MEDICO",
        status: "ACTIVE",
        especializacionId: { in: espIds },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        especializacion: { select: { nombre: true } }
      },
    });

    return res.status(200).json({
      page: parseInt(page, 10),
      total,
      totalPages: Math.ceil(total / limit),
      doctors,
    });
  } catch (err) {
    console.error("Error en getDoctorsBySpecialty:", err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = { getUsersByRole, getDoctorsBySpecialty };
const { userById } = require("../services/userService");

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.status(200).json({ ...user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getUserById };
