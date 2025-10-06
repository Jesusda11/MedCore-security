const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Función auxiliar para calcular edad
const calculateAge = (birthDate) => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
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
        current_password: true,
        status: true,
        phone: true,
        date_of_birth: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { id: true, fullname: true, email: true } },
        updatedBy: { select: { id: true, fullname: true, email: true } },
      },
    });

    // Calcular edad dinámicamente para cada paciente
    const pacientesConEdad = pacientes.map((p) => ({
      ...p,
      age: p.date_of_birth ? calculateAge(p.date_of_birth) : null,
    }));

    const total = await prisma.users.count({
      where: { role: "PACIENTE" },
    });

    return res.status(200).json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: pacientesConEdad,
    });
  } catch (error) {
    console.error("Error obteniendo pacientes:", error);
    return res.status(500).json({ error: "Error al obtener pacientes" });
  }
};

// Obtener paciente por ID
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await prisma.users.findFirst({
      where: { id, role: "PACIENTE" },
      select: {
        id: true,
        fullname: true,
        email: true,
        identificacion: true,
        phone: true,
        date_of_birth: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { id: true, fullname: true, email: true } },
        updatedBy: { select: { id: true, fullname: true, email: true } },
      },
    });

    if (!patient) {
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
    console.error("Error en getPatientById:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Actualizar paciente
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    let { fullname, identificacion, email, phone, date_of_birth, status } = req.body;
    const userId = req.user?.id;

    if (date_of_birth) {
      const parsedDate = new Date(date_of_birth);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "La fecha de nacimiento no es válida" });
      }
      date_of_birth = parsedDate;
    }

    const updatedPatient = await prisma.users.update({
      where: { id },
      data: {
        identificacion: identificacion || undefined,
        fullname: fullname || undefined,
        phone: phone || undefined,
        email: email || undefined,
        date_of_birth: date_of_birth || undefined,
        status: status || undefined,
        updatedBy: userId ? { connect: { id: userId } } : undefined,
      },
      select: {
        id: true,
        email: true,
        identificacion: true,
        fullname: true,
        current_password: true,
        status: true,
        phone: true,
        date_of_birth: true,
        createdAt: true,
        updatedAt: true,
        updatedBy: { select: { id: true, fullname: true, email: true } },
      },
    });

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
    console.error("Error en updatePatient:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Actualizar estado del paciente
const updatePatientState = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    const allowedStatus = ["ACTIVE", "INACTIVE"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: `El estado debe ser uno de: ${allowedStatus.join(", ")}`
      });
    }

    const patient = await prisma.users.findFirst({
      where: { id, role: "PACIENTE" },
    });

    if (!patient) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }

    const updatedPatient = await prisma.users.update({
      where: { id: patient.id },
      data: {
        status,
        updatedBy: userId ? { connect: { id: userId } } : undefined,
      },
      select: {
        id: true,
        email: true,
        identificacion: true,
        fullname: true,
        phone: true,
        date_of_birth: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        updatedBy: { select: { id: true, fullname: true, email: true } },
      },
    });

    return res.json({
      message: "Estado del paciente actualizado correctamente",
      patient: updatedPatient,
    });
  } catch (error) {
    console.error("Error en updatePatientState:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  updatePatient,
  updatePatientState,
};
