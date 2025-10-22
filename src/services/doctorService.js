const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { createUserBase } = require("../services/userService");

async function createDoctor({ especializacion, departamento, userData, creatorId }) {
  if (!especializacion) {
    throw new Error("Debe especificar una especialización");
  }

  let esp = await prisma.especializacion.findFirst({
    where: { nombre: especializacion },
    include: { departamento: true },
  });

  let dept = null;

  if (!esp) {
    if (!departamento) {
      throw new Error("Debe especificar un departamento si la especialización no existe todavía.");
    }

    dept = await prisma.departamento.upsert({
      where: { nombre: departamento },
      update: {},
      create: { nombre: departamento },
    });

    esp = await prisma.especializacion.create({
      data: { nombre: especializacion, departamentoId: dept.id },
    });
  } else {
    dept = esp.departamento;
  }

  const doctorBase = await createUserBase(
    {
      ...userData,
      role: "MEDICO",
      especializacionId: esp.id,
    },
    creatorId
  );

  return {
    id: doctorBase.id,
    fullname: doctorBase.fullname,
    email: doctorBase.email,
    especializacion: esp.nombre,
    departamento: dept.nombre,
  };
}

module.exports = { createDoctor };