const { PrismaClient } = require("../generated/prisma");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();
const { validateUserData } = require("../utils/validators");

async function createUserBase(data, creatorId = null) {
  const {
    email,
    current_password,
    fullname,
    identificacion,
    role,
    phone,
    date_of_birth,
    especializacionId, 
    departamentoId,
  } = data;

  // Validaciones comunes (reutilizadas)
  const validationError = validateUserData({ email, current_password, identificacion, date_of_birth });
  if (validationError) {
    throw new Error(validationError);
  }

  // Verificar duplicados
  const existingUser = await prisma.users.findFirst({ where: { identificacion } });
  if (existingUser) throw new Error("La identificación ya está registrada");

  const existingEmail = await prisma.users.findFirst({ where: { email } });
  if (existingEmail) throw new Error("El correo ya está registrado");

  // Crear usuario base
  const user = await prisma.users.create({
    data: {
      email: email.toLowerCase().trim(),
      current_password: await bcrypt.hash(current_password, 10),
      fullname,
      identificacion,
      role,
      phone: phone || null,
      date_of_birth: new Date(date_of_birth),
      status: "PENDING",
      createdById: creatorId,
      updatedById: creatorId,
      especializacionId, 
      departamentoId,
    },
  });

  return user;
}

module.exports = { createUserBase };
