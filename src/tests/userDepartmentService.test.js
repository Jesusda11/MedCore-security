const mockPrismaInstance = {
  users: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  departamento: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock("../generated/prisma", () => {
  return {
    PrismaClient: jest.fn(() => mockPrismaInstance),
  };
});

jest.mock("bcrypt");

const {
  createUserWithDepartment,
} = require("../services/userDepartmentService");
const bcrypt = require("bcrypt");

/**
 * Integration tests for User Department Service
 * Covers creating users with existing and new departments,
 * handling missing department names, and case insensitivity.
 */
describe("User Department Service tests", () => {
  const prisma = mockPrismaInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.hash = jest.fn().mockResolvedValue("hashed_password");
  });

  test("should create nurse with existing department", async () => {
    const nurseData = {
      departamento: "Emergencias",
      userData: {
        email: "enfermera@hospital.com",
        current_password: "SecurePass123",
        fullname: "Enfermera Ana López",
        identificacion: "22334455",
        phone: "5552222",
        date_of_birth: "1990-04-12",
      },
      creatorId: 1,
      role: "ENFERMERA",
    };

    const mockDepartamento = {
      id: 3,
      nombre: "emergencias",
    };

    const mockCreatedUser = {
      id: 15,
      email: nurseData.userData.email,
      fullname: nurseData.userData.fullname,
      identificacion: nurseData.userData.identificacion,
      role: "ENFERMERA",
      status: "PENDING",
      departamentoId: 3,
      createdById: 1,
      updatedById: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prisma.departamento.findFirst.mockResolvedValue(mockDepartamento);
    prisma.users.findFirst.mockResolvedValue(null);
    prisma.users.create.mockResolvedValue(mockCreatedUser);

    const result = await createUserWithDepartment(nurseData);

    expect(prisma.departamento.findFirst).toHaveBeenCalledWith({
      where: { nombre: { equals: "emergencias", mode: "insensitive" } },
    });
    expect(result.departamento).toBe("emergencias");
    expect(result.role).toBe("ENFERMERA");
  });

  test("should create nurse with new department", async () => {
    const nurseData = {
      departamento: "Cuidados Intensivos",
      userData: {
        email: "icu.nurse@hospital.com",
        current_password: "SecurePass123",
        fullname: "Enfermera Patricia Ruiz",
        identificacion: "33445566",
        phone: "5553333",
        date_of_birth: "1988-09-25",
      },
      creatorId: 1,
      role: "ENFERMERA",
    };

    const mockNewDepartamento = {
      id: 8,
      nombre: "cuidados intensivos",
    };

    const mockCreatedUser = {
      id: 25,
      email: nurseData.userData.email,
      fullname: nurseData.userData.fullname,
      identificacion: nurseData.userData.identificacion,
      role: "ENFERMERA",
      status: "PENDING",
      departamentoId: 8,
      createdById: 1,
      updatedById: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prisma.departamento.findFirst.mockResolvedValue(null);
    prisma.departamento.create.mockResolvedValue(mockNewDepartamento);
    prisma.users.findFirst.mockResolvedValue(null);
    prisma.users.create.mockResolvedValue(mockCreatedUser);

    const result = await createUserWithDepartment(nurseData);

    expect(prisma.departamento.findFirst).toHaveBeenCalled();
    expect(prisma.departamento.create).toHaveBeenCalledWith({
      data: { nombre: "cuidados intensivos" },
    });
    expect(result.departamento).toBe("cuidados intensivos");
  });

  test("should throw error when department is not provided", async () => {
    const nurseData = {
      departamento: null,
      userData: {
        email: "nurse@hospital.com",
        current_password: "SecurePass123",
        fullname: "Enfermera Test",
        identificacion: "12345678",
        phone: "5551111",
        date_of_birth: "1990-01-01",
      },
      creatorId: 1,
      role: "ENFERMERA",
    };

    await expect(createUserWithDepartment(nurseData)).rejects.toThrow(
      "Debe especificar un departamento",
    );
  });

  test("should handle department name case insensitively", async () => {
    const nurseData = {
      departamento: "PEDIATRÍA",
      userData: {
        email: "pediatric.nurse@hospital.com",
        current_password: "SecurePass123",
        fullname: "Enfermera Laura Díaz",
        identificacion: "44556677",
        phone: "5554444",
        date_of_birth: "1992-11-30",
      },
      creatorId: 1,
      role: "ENFERMERA",
    };

    const mockDepartamento = {
      id: 4,
      nombre: "pediatría",
    };

    const mockCreatedUser = {
      id: 30,
      email: nurseData.userData.email,
      fullname: nurseData.userData.fullname,
      identificacion: nurseData.userData.identificacion,
      role: "ENFERMERA",
      status: "PENDING",
      departamentoId: 4,
      createdById: 1,
      updatedById: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prisma.departamento.findFirst.mockResolvedValue(mockDepartamento);
    prisma.users.findFirst.mockResolvedValue(null);
    prisma.users.create.mockResolvedValue(mockCreatedUser);

    const result = await createUserWithDepartment(nurseData);

    expect(prisma.departamento.findFirst).toHaveBeenCalledWith({
      where: { nombre: { equals: "pediatría", mode: "insensitive" } },
    });
    expect(result.departamento).toBe("pediatría");
  });
});
