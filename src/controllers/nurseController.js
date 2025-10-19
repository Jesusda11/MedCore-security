const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { createUserBase, getBaseUserById, updateUserBase, toggleUserStatus } = require("../services/userService");

const registerNurse = async (req, res) => {
  try {
    const { departamento, ...userData } = req.body;

    if (!departamento) {
      return res.status(400).json({ message: "Debe especificar un departamento" });
    }

    const nurseBase = await createUserBase({ ...userData, role: "ENFERMERA" }, req.user?.id);

    const deptName = departamento.trim().toLowerCase();

    let dept = await prisma.departamento.findFirst({
      where: { nombre: { equals: deptName, mode: "insensitive" } },
    });

    if (!dept) {
      dept = await prisma.departamento.create({ data: { nombre: deptName } });
    }

    const updatedNurse = await prisma.users.update({
      where: { id: nurseBase.id },
      data: { departamentoId: dept.id },
    });

    res.status(201).json({
      message: "Enfermera registrada correctamente",
      nurse: {
        id: updatedNurse.id,
        fullname: updatedNurse.fullname,
        email: updatedNurse.email,
        identificacion: updatedNurse.identificacion,
        role: updatedNurse.role,
        status: updatedNurse.status,
        departamento: dept.nombre,
        createdById: updatedNurse.createdById,
        updatedById: updatedNurse.updatedById,
        createdAt: updatedNurse.createdAt,
        updatedAt: updatedNurse.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error en registerNurse:", error);
    res.status(500).json({ message: error.message || "Error interno del servidor" });
  }
};

const getNurseById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await getBaseUserById(id);
    if (!user || user.role !== "ENFERMERA") {
      return res.status(404).json({ message: "Enfermero no encontrado" });
    }

    const nurseDetails = await prisma.users.findUnique({
      where: { id },
      select: {
        departamento: { select: { nombre: true } },
      },
    });

    return res.status(200).json({
      ...user,
      departamento: nurseDetails?.departamento?.nombre || null,
    });
  } catch (error) {
    console.error("Error en getNurseById:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const updateNurse = async (req, res) => {
  try {
    const { id } = req.params;
    const { departamento, ...userData } = req.body;

    const nurse = await getBaseUserById(id);
    if (!nurse || nurse.role !== "ENFERMERA") {
      return res.status(404).json({ message: "Enfermera no encontrada" });
    }

    const updatedNurse = await updateUserBase(id, userData, req.user?.id);

    if (departamento) {
      const deptName = departamento.trim().toLowerCase();

      let dept = await prisma.departamento.findFirst({
        where: { nombre: { equals: deptName, mode: "insensitive" } },
      });

      if (!dept) {
        dept = await prisma.departamento.create({ data: { nombre: deptName } });
      }

      await prisma.users.update({
        where: { id },
        data: { departamentoId: dept.id },
      });
    }

    const nurseDetails = await prisma.users.findUnique({
      where: { id },
      select: {
        departamento: { select: { nombre: true } },
      },
    });

    return res.status(200).json({
      message: "Enfermera actualizada correctamente",
      nurse: {
        ...updatedNurse,
        departamento: nurseDetails?.departamento?.nombre || null,
      },
    });
  } catch (error) {
    console.error("Error en updateNurse:", error);
    return res.status(500).json({ message: error.message || "Error interno del servidor" });
  }
};

const toggleNurseStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const nurse = await prisma.users.findUnique({
      where: { id },
      select: { id: true, role: true, status: true },
    });

    if (!nurse || nurse.role !== "ENFERMERA") {
      return res.status(404).json({ message: "Enfermera no encontrada" });
    }

    const updatedNurse = await toggleUserStatus(id, req.user?.id);

    const nurseDetails = await prisma.users.findUnique({
      where: { id },
      select: {
        departamento: { select: { nombre: true } },
      },
    });

    return res.status(200).json({
      message: `Enfermera ${updatedNurse.status === "ACTIVE" ? "activada" : "desactivada"} correctamente`,
      nurse: {
        ...updatedNurse,
        departamento: nurseDetails?.departamento?.nombre || null,
      },
    });
  } catch (error) {
    console.error("Error en toggleNurseStatus:", error);
    return res.status(500).json({ message: error.message || "Error interno del servidor" });
  }
};

module.exports = { registerNurse, getNurseById, updateNurse, toggleNurseStatus };

