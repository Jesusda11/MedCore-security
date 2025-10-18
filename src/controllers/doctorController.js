const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { createUserBase } = require("../services/userService");

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
    console.log(esp.id);
    
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

module.exports = { registerDoctor };
