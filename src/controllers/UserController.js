const { PrismaClient } = require("../generated/prisma");
const { userById } = require("../services/userService");
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

module.exports = { getUsersByRole, getUserById };
