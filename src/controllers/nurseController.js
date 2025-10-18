const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { createUserBase } = require("../services/userService");

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

module.exports = { registerNurse };
