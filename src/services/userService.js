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

const getBaseUserById = async (id) => {
  return prisma.users.findUnique({
    where: { id,
      status: 'ACTIVE'
     },
    select: {
      id: true,
      fullname: true,
      email: true,
      identificacion: true,
      role: true,
      status: true,
      phone: true,
      license_number: true,
      date_of_birth: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { fullname: true, email: true } },
      updatedBy: { select: { fullname: true, email: true } },
    },
  });
};

const updateUserBase = async (id, data, updaterId = null) => {
  const {
    email,
    current_password,
    fullname,
    identificacion,
    phone,
    date_of_birth,
    license_number,
    status,
  } = data;

  // Validar que el usuario existe
  const existingUser = await prisma.users.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new Error("Usuario no encontrado");
  }

  // Validar solo si se están actualizando los campos críticos
  const fieldsToValidate = {};
  if (email !== undefined) fieldsToValidate.email = email;
  if (current_password !== undefined) fieldsToValidate.current_password = current_password;
  if (identificacion !== undefined) fieldsToValidate.identificacion = identificacion;
  if (date_of_birth !== undefined) fieldsToValidate.date_of_birth = date_of_birth;

  // Solo validar si hay campos críticos para actualizar
  const hasCriticalFields = Object.keys(fieldsToValidate).length > 0;
  
  if (hasCriticalFields) {
    // Completar con datos existentes para validación
    const dataToValidate = {
      email: fieldsToValidate.email || existingUser.email,
      current_password: fieldsToValidate.current_password || "Valid123", // Placeholder si no se actualiza
      identificacion: fieldsToValidate.identificacion || existingUser.identificacion,
      date_of_birth: fieldsToValidate.date_of_birth || existingUser.date_of_birth,
    };

    const validationError = validateUserData(dataToValidate);
    if (validationError) {
      throw new Error(validationError);
    }
  }

  // Verificar duplicados si se está actualizando identificación
  if (identificacion && identificacion !== existingUser.identificacion) {
    const duplicateId = await prisma.users.findFirst({
      where: { identificacion, NOT: { id } },
    });
    if (duplicateId) throw new Error("La identificación ya está registrada");
  }

  // Verificar duplicados si se está actualizando email
  if (email && email !== existingUser.email) {
    const duplicateEmail = await prisma.users.findFirst({
      where: { email: email.toLowerCase().trim(), NOT: { id } },
    });
    if (duplicateEmail) throw new Error("El correo ya está registrado");
  }

  // Construir objeto de actualización solo con campos definidos
  const updateData = {};
  
  if (email !== undefined) updateData.email = email.toLowerCase().trim();
  if (current_password !== undefined) {
    updateData.current_password = await bcrypt.hash(current_password, 10);
  }
  if (fullname !== undefined) updateData.fullname = fullname;
  if (identificacion !== undefined) updateData.identificacion = identificacion;
  if (phone !== undefined) updateData.phone = phone;
  if (date_of_birth !== undefined) updateData.date_of_birth = new Date(date_of_birth);
  if (license_number !== undefined) updateData.license_number = license_number;
  if (status !== undefined) updateData.status = status;
  if (updaterId) updateData.updatedById = updaterId;

  // Actualizar usuario
  const updatedUser = await prisma.users.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      fullname: true,
      email: true,
      identificacion: true,
      role: true,
      status: true,
      phone: true,
      license_number: true,
      date_of_birth: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { fullname: true, email: true } },
      updatedBy: { select: { fullname: true, email: true } },
    },
  });

  return updatedUser;
};

const toggleUserStatus = async (id, updaterId = null) => {
 
  const existingUser = await prisma.users.findUnique({
    where: { id },
    select: { id: true, status: true, role: true },
  });

  if (!existingUser) {
    throw new Error("Usuario no encontrado");
  }

  const newStatus = existingUser.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const updatedUser = await prisma.users.update({
    where: { id },
    data: { 
      status: newStatus,
      updatedById: updaterId,
    },
    select: {
      id: true,
      fullname: true,
      email: true,
      identificacion: true,
      role: true,
      status: true,
      phone: true,
      license_number: true,
      date_of_birth: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { fullname: true, email: true } },
      updatedBy: { select: { fullname: true, email: true } },
    },
  });

  return updatedUser;
};

module.exports = { createUserBase, getBaseUserById, updateUserBase, toggleUserStatus };


