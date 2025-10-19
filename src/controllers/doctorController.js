const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const {
  createUserBase,
  getBaseUserById,
  updateUserBase,
  toggleUserStatus,
} = require("../services/userService");

const registerDoctor = async (req, res) => {
  try {
    const { especializacion, departamento, ...userData } = req.body;

    if (!especializacion) {
      return res.status(400).json({ message: "Debe especificar una especialización" });
    }

    let esp = await prisma.especializacion.findFirst({
      where: { nombre: especializacion },
      include: { departamento: true },
    });

    let dept = null;

    if (!esp) {
      if (!departamento) {
        return res.status(400).json({
          message:
            "Debe especificar un departamento si la especialización no existe todavía.",
        });
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
      req.user?.id
    );
    
    return res.status(201).json({
      message: "Doctor registrado correctamente",
      doctor: {
        id: doctorBase.id,
        fullname: doctorBase.fullname,
        email: doctorBase.email,
        especializacion: esp.nombre,
        departamento: dept.nombre,
      },
    });
  } catch (error) {
    console.error("Error en registerDoctor:", error);
    return res
      .status(500)
      .json({ message: error.message || "Error interno del servidor" });
  }
};

const getDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialty, page = 1 } = req.query;
    if (!specialty) return res.status(400).json({ message: "Debe especificar 'specialty'" });

    const limit = 20;
    const skip = (parseInt(page, 10) - 1) * limit;

    const especializaciones = await prisma.especializacion.findMany({
      where: { nombre: { equals: specialty, mode: "insensitive" } },
      select: { id: true, nombre: true, departamentoId: true },
    });

    if (!especializaciones || especializaciones.length === 0) {
      return res.status(404).json({ message: `No se encontró la especialidad '${specialty}'` });
    }

    const espIds = especializaciones.map(e => e.id);

    const total = await prisma.users.count({
      where: {
        role: "MEDICO",
        status: "ACTIVE",
        especializacionId: { in: espIds },
      },
    });

    const doctors = await prisma.users.findMany({
      where: {
        role: "MEDICO",
        status: "ACTIVE",
        especializacionId: { in: espIds },
      },
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
        especializacion: { select: { nombre: true } }
      },
    });

    return res.status(200).json({
      page: parseInt(page, 10),
      total,
      totalPages: Math.ceil(total / limit),
      doctors,
    });
  } catch (err) {
    console.error("Error en getDoctorsBySpecialty:", err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await getBaseUserById(id);
    if (!user || user.role !== "MEDICO") {
      return res.status(404).json({ message: "Doctor no encontrado" });
    }

    const doctorDetails = await prisma.users.findUnique({
      where: { id },
      select: {
        especializacion: {
          select: {
            nombre: true,
            departamento: { select: { nombre: true } },
          },
        },
      },
    });

    return res.status(200).json({
      ...user,
      especializacion: doctorDetails?.especializacion?.nombre || null,
      departamento: doctorDetails?.especializacion?.departamento?.nombre || null,
    });
  } catch (error) {
    console.error("Error en getDoctorById:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { especializacion, departamento, ...userData } = req.body;

    const doctor = await getBaseUserById(id);
    if (!doctor || doctor.role !== "MEDICO") {
      return res.status(404).json({ message: "Doctor no encontrado" });
    }

    const updatedDoctor = await updateUserBase(id, userData, req.user?.id);

    // Actualizar especialización si se proporciona
    if (especializacion) {
      let esp = await prisma.especializacion.findFirst({
        where: { nombre: especializacion },
        include: { departamento: true },
      });

      if (!esp) {
        if (!departamento) {
          return res.status(400).json({
            message: "Debe especificar un departamento si la especialización no existe todavía.",
          });
        }

        const dept = await prisma.departamento.upsert({
          where: { nombre: departamento },
          update: {},
          create: { nombre: departamento },
        });

        esp = await prisma.especializacion.create({
          data: { nombre: especializacion, departamentoId: dept.id },
        });
      }

      await prisma.users.update({
        where: { id },
        data: { especializacionId: esp.id },
      });
    }

    const doctorDetails = await prisma.users.findUnique({
      where: { id },
      select: {
        especializacion: {
          select: {
            nombre: true,
            departamento: { select: { nombre: true } },
          },
        },
      },
    });

    return res.status(200).json({
      message: "Doctor actualizado correctamente",
      doctor: {
        ...updatedDoctor,
        especializacion: doctorDetails?.especializacion?.nombre || null,
        departamento: doctorDetails?.especializacion?.departamento?.nombre || null,
      },
    });
  } catch (error) {
    console.error("Error en updateDoctor:", error);
    return res.status(500).json({ message: error.message || "Error interno del servidor" });
  }
};

const toggleDoctorStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.users.findUnique({
      where: { id },
      select: { id: true, role: true, status: true },
    });

    if (!doctor || doctor.role !== "MEDICO") {
      return res.status(404).json({ message: "Doctor no encontrado" });
    }

    const updatedDoctor = await toggleUserStatus(id, req.user?.id);

    const doctorDetails = await prisma.users.findUnique({
      where: { id },
      select: {
        especializacion: {
          select: {
            nombre: true,
            departamento: { select: { nombre: true } },
          },
        },
      },
    });

    return res.status(200).json({
      message: `Doctor ${updatedDoctor.status === "ACTIVE" ? "activado" : "desactivado"} correctamente`,
      doctor: {
        ...updatedDoctor,
        especializacion: doctorDetails?.especializacion?.nombre || null,
        departamento: doctorDetails?.especializacion?.departamento?.nombre || null,
      },
    });
  } catch (error) {
    console.error("Error en toggleDoctorStatus:", error);
    return res.status(500).json({ message: error.message || "Error interno del servidor" });
  }
};


module.exports = { registerDoctor, getDoctorById, updateDoctor, toggleDoctorStatus, getDoctorsBySpecialty };


