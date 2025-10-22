const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { createUserBase } = require("./userService");

async function createUserWithDepartment({ departamento, userData, creatorId, role }) {
  if (!departamento) {
    throw new Error("Debe especificar un departamento");
  }

  const deptName = departamento.trim().toLowerCase();

  let dept = await prisma.departamento.findFirst({
    where: { nombre: { equals: deptName, mode: "insensitive" } },
  });

  if (!dept) {
    dept = await prisma.departamento.create({
      data: { nombre: deptName },
    });
  }

  const userBase = await createUserBase(
    { ...userData, role, departamentoId: dept.id },
    creatorId
  );

  return {
    id: userBase.id,
    fullname: userBase.fullname,
    email: userBase.email,
    identificacion: userBase.identificacion,
    role: userBase.role,
    status: userBase.status,
    departamento: dept.nombre,
    createdById: userBase.createdById,
    updatedById: userBase.updatedById,
    createdAt: userBase.createdAt,
    updatedAt: userBase.updatedAt,
  };
}

module.exports = { createUserWithDepartment };
