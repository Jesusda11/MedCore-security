const { PrismaClient } = require("../generated/prisma");
const {
  usersByRole,
  usersByRoleAndStatus,
  searchUsers,
  getBaseUserById,
  searchUsersByRole,
} = require("../services/userService");
const { updateUserBase } = require("../services/userService");
const { updateDoctor } = require("./doctorController");
const { updateNurse } = require("./nurseController");
const prisma = new PrismaClient();

const getUsersByRole = async (req, res) => {
  try {
    const { role, page = 1 } = req.query;

    if (!role) {
      return res.status(400).json({
        message: "Debe especificar el parámetro 'role'",
      });
    }

    const result = await usersByRole(role, page);

    return res.status(200).json({
      page: parseInt(page),
      total: result.total,
      totalPages: result.totalPages,
      users: result.users,
    });
  } catch (error) {
    console.error("Error en getUsersByRole:", error);
    return res.status(400).json({
      message: error.message || "Error interno del servidor",
    });
  }
};
/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await getBaseUserById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.status(200).json({ ...user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUsersByRoleAndStatus = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;

    if (!role) {
      return res.status(400).json({
        message: "Debe especificar el parámetro 'role'",
      });
    }

    const result = await usersByRoleAndStatus(
      role,
      status,
      parseInt(page),
      parseInt(limit),
    );

    if (!result.users.length) {
      return res.status(404).json({
        message: "No se encontraron usuarios con esos criterios",
      });
    }

    return res.status(200).json({
      page: parseInt(page),
      total: result.total,
      totalPages: result.totalPages,
      users: result.users,
    });
  } catch (error) {
    console.error("Error en getUsersByRoleAndStatus:", error);
    return res.status(400).json({
      message: error.message || "Error interno del servidor",
    });
  }
};

const getUsersBySearch = async (req, res) => {
  try {
    const { role, query } = req.query;

    if (!query) {
      return res.status(400).json({
        message: "Debe especificar el parámetro 'query'",
      });
    }

    const users = await searchUsers(query, role);

    if (!users.length) {
      return res.status(404).json({ message: "No se encontraron usuarios" });
    }

    return res.status(200).json({
      total: users.length,
      users,
    });
  } catch (error) {
    console.error("Error en getUsersBySearch:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

const updateUserByRole = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    const user = await prisma.users.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    switch (user.role) {
      case "MEDICO":
        return await updateDoctor(req, res);

      case "ENFERMERA":
        return await updateNurse(req, res);

      case "PACIENTE":
        return await updateUserBase(id, req.body, currentUserId);

      default:
        return res.status(400).json({ message: "Rol no soportado" });
    }
  } catch (error) {
    console.error("Error en updateUserByRole:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const getUsersBySearchAndRole = async (req, res) => {
  try {
    const { query, role } = req.query;

    if (!query) {
      return res.status(400).json({
        message: "Debe especificar el parámetro 'query'",
      });
    }

    const users = await searchUsersByRole(query, role);

    if (!users.length) {
      return res.status(404).json({ message: "No se encontraron usuarios" });
    }

    return res.status(200).json({
      total: users.length,
      users,
    });
  } catch (error) {
    console.error("Error en getUsersBySearch:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};


module.exports = {
getUsersByRole, 
getUserById, 
getUsersByRoleAndStatus,
getUsersBySearch, 
updateUserByRole,
getUsersBySearchAndRole};
