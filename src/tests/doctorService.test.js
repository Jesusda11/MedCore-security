const mockPrismaInstance = {
  users: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  especializacion: {
    findFirst: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
  departamento: {
    upsert: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
  },
};

jest.mock("../generated/prisma", () => {
  return {
    PrismaClient: jest.fn(() => mockPrismaInstance),
  };
});

jest.mock("bcrypt");

const { createDoctor } = require("../services/doctorService");
const bcrypt = require("bcrypt");

/**
 * Integration tests for Doctor Service
 * Covers creating doctors with existing and new specializations and departments,
 * as well as handling missing required fields.
 */
describe("Doctor Service tests", () => {
  const prisma = mockPrismaInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.hash = jest.fn().mockResolvedValue("hashed_password");
  });

  test("should create doctor with existing specialization", async () => {
    const doctorData = {
      especializacion: "cardiología",
      departamento: "medicina interna",
      userData: {
        email: "cardiologo@hospital.com",
        current_password: "SecurePass123",
        fullname: "Dr. Carlos Mendoza",
        identificacion: "12345678",
        phone: "555-1234",
        date_of_birth: "1980-03-15",
      },
      creatorId: 1,
    };

    const mockEspecializacion = {
      id: 1,
      nombre: "cardiología",
      departamentoId: 1,
      departamento: {
        id: 1,
        nombre: "medicina interna",
      },
    };

    const mockCreatedUser = {
      id: 10,
      email: doctorData.userData.email,
      fullname: doctorData.userData.fullname,
      role: "MEDICO",
      especializacionId: 1,
    };

    prisma.especializacion.findFirst.mockResolvedValue(mockEspecializacion);
    prisma.users.findFirst.mockResolvedValue(null);
    prisma.users.create.mockResolvedValue(mockCreatedUser);

    const result = await createDoctor(doctorData);

    expect(prisma.especializacion.findFirst).toHaveBeenCalledWith({
      where: { nombre: "cardiología" },
      include: { departamento: true },
    });
    expect(result.especializacion).toBe("cardiología");
    expect(result.departamento).toBe("medicina interna");
  });

  test("should create doctor with new specialization and department", async () => {
    const doctorData = {
      especializacion: "neurología",
      departamento: "neurociencias",
      userData: {
        email: "neurologo@hospital.com",
        current_password: "SecurePass123",
        fullname: "Dra. Ana Torres",
        identificacion: "87654321",
        phone: "555-5678",
        date_of_birth: "1985-07-20",
      },
      creatorId: 1,
    };

    const mockDepartamento = {
      id: 5,
      nombre: "neurociencias",
    };

    const mockEspecializacion = {
      id: 10,
      nombre: "neurología",
      departamentoId: 5,
    };

    const mockCreatedUser = {
      id: 20,
      email: doctorData.userData.email,
      fullname: doctorData.userData.fullname,
      role: "MEDICO",
      especializacionId: 10,
    };

    prisma.especializacion.findFirst.mockResolvedValue(null);
    prisma.departamento.upsert.mockResolvedValue(mockDepartamento);
    prisma.especializacion.create.mockResolvedValue(mockEspecializacion);
    prisma.users.findFirst.mockResolvedValue(null);
    prisma.users.create.mockResolvedValue(mockCreatedUser);

    const result = await createDoctor(doctorData);

    expect(prisma.departamento.upsert).toHaveBeenCalled();
    expect(prisma.especializacion.create).toHaveBeenCalled();
    expect(result.email).toBe(doctorData.userData.email);
  });

  test("should throw error when specialization is missing", async () => {
    const doctorData = {
      especializacion: null,
      departamento: "medicina interna",
      userData: {
        email: "doctor@hospital.com",
        current_password: "SecurePass123",
        fullname: "Dr. Test",
        identificacion: "12345678",
        phone: "555-1234",
        date_of_birth: "1980-01-01",
      },
      creatorId: 1,
    };

    await expect(createDoctor(doctorData)).rejects.toThrow(
      "Debe especificar una especialización",
    );
  });

  test("should throw error when department is missing for new specialization", async () => {
    const doctorData = {
      especializacion: "pediatría",
      departamento: null,
      userData: {
        email: "pediatra@hospital.com",
        current_password: "SecurePass123",
        fullname: "Dr. Pedro González",
        identificacion: "11223344",
        phone: "555-9999",
        date_of_birth: "1982-05-10",
      },
      creatorId: 1,
    };

    prisma.especializacion.findFirst.mockResolvedValue(null);

    await expect(createDoctor(doctorData)).rejects.toThrow(
      "Debe especificar un departamento si la especialización no existe todavía",
    );
  });
});
