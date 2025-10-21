const { PrismaClient } = require("../generated/prisma");
const {
  createUserBase,
  toggleUserStatus,
  updateUserBase,
  getBaseUserById,
} = require("../services/userService");
const prisma = new PrismaClient();

// Función auxiliar para calcular edad
const calculateAge = (birthDate) => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

// Obtener todos los pacientes
const getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const pacientes = await prisma.users.findMany({
      where: { role: "PACIENTE" },
      skip: parseInt(skip),
      take: parseInt(limit),
      select: {
        id: true,
        email: true,
        identificacion: true,
        fullname: true,
        current_password: false,
        status: true,
        phone: true,
        date_of_birth: true,
      },
    });

    // Calcular edad dinámicamente para cada paciente
    const pacientesConEdad = pacientes.map((p) => ({
      ...p,
      age: p.date_of_birth ? calculateAge(p.date_of_birth) : null,
    }));

    const total = pacientesConEdad.length;

    return res.status(200).json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: pacientesConEdad,
    });
  } catch (error) {
    return res.status(500).json({ error: "Error al obtener pacientes" });
  }
};

// Obtener paciente por ID
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await getBaseUserById(id);

    if (!patient || patient.role !== "PACIENTE") {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }

    const age = patient.date_of_birth
      ? calculateAge(patient.date_of_birth)
      : null;

    return res.json({
      ...patient,
      age,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const createPatient = async (req, res) => {
  try {
    const patientBase = await createUserBase(
      {
        ...req.body,
        role: "PACIENTE",
      },
      rq.user?.id,
    );

    return res.status(201).json({
      message: "Paciente creado correctamente",
      patient: patientBase,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Actualizar paciente
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { ...userData } = req.body;
    const userId = req.user?.id;

    const updatedPatient = await updateUserBase(id, userData, userId);
    const age = updatedPatient.date_of_birth
      ? calculateAge(updatedPatient.date_of_birth)
      : null;

    return res.status(200).json({
      message: "Paciente actualizado correctamente",
      patient: {
        ...updatedPatient,
        age,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Actualizar estado del paciente
const updatePatientState = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const updatedPatient = await toggleUserStatus(id, userId);

    return res.json({
      message: `Paciente ${updatedPatient.status === "ACTIVE" ? "activado" : "desactivado"} correctamente`,
      patient: updatedPatient,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  updatePatientState,
};
