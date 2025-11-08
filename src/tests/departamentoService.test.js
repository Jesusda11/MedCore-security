const mockPrismaInstance = {
  departamento: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    updateMany: jest.fn(),
  },
  especializacion: {
    deleteMany: jest.fn(),
  },
  users: {
    updateMany: jest.fn(),
  },
};

jest.mock("../generated/prisma", () => {
  return {
    PrismaClient: jest.fn(() => mockPrismaInstance),
  };
});

const {
  listDepartamentos,
  deleteDepartamento,
} = require("../services/departamentoService");

/**
 * Integration tests for Department Service
 * Tests department listing and deletion with cascade effects.
 */
describe("Department Service tests", () => {
  const prisma = mockPrismaInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should list all departments ordered by name", async () => {
    const mockDepartamentos = [
      { id: 1, nombre: "cardiología" },
      { id: 2, nombre: "emergencias" },
      { id: 3, nombre: "pediatría" },
    ];

    prisma.departamento.findMany.mockResolvedValue(mockDepartamentos);

    const result = await listDepartamentos();

    expect(prisma.departamento.findMany).toHaveBeenCalledWith({
      orderBy: { nombre: "asc" },
    });
    expect(result).toHaveLength(3);
    expect(result[0].nombre).toBe("cardiología");
  });

  test("should return empty array when no departments exist", async () => {
    prisma.departamento.findMany.mockResolvedValue([]);

    const result = await listDepartamentos();

    expect(result).toEqual([]);
    expect(prisma.departamento.findMany).toHaveBeenCalled();
  });

  test("should delete department with cascade delete of specializations and nullify users", async () => {
    const departmentId = 1;
    const mockDepartamento = {
      id: departmentId,
      nombre: "cardiología",
      especializaciones: [
        { id: 1, nombre: "cardiología general" },
        { id: 2, nombre: "cardiología pediátrica" },
      ],
      users: [
        { id: 10, fullname: "Dr. Juan" },
        { id: 11, fullname: "Dra. María" },
      ],
    };

    prisma.departamento.findUnique.mockResolvedValue(mockDepartamento);
    prisma.especializacion.deleteMany.mockResolvedValue({ count: 2 });
    prisma.users.updateMany.mockResolvedValue({ count: 2 });
    prisma.departamento.delete.mockResolvedValue(mockDepartamento);

    const result = await deleteDepartamento(departmentId);

    expect(prisma.departamento.findUnique).toHaveBeenCalledWith({
      where: { id: departmentId },
      include: { especializaciones: true, users: true },
    });
    expect(prisma.especializacion.deleteMany).toHaveBeenCalledWith({
      where: { departamentoId: departmentId },
    });
    expect(prisma.users.updateMany).toHaveBeenCalledWith({
      where: { departamentoId: departmentId },
      data: { departamentoId: null },
    });
    expect(prisma.departamento.delete).toHaveBeenCalledWith({
      where: { id: departmentId },
    });
    expect(result.message).toContain("eliminadas correctamente");
  });

  test("should throw error when trying to delete non-existent department", async () => {
    const departmentId = 999;

    prisma.departamento.findUnique.mockResolvedValue(null);

    await expect(deleteDepartamento(departmentId)).rejects.toThrow(
      "El departamento no existe",
    );

    expect(prisma.departamento.findUnique).toHaveBeenCalledWith({
      where: { id: departmentId },
      include: { especializaciones: true, users: true },
    });
    expect(prisma.departamento.delete).not.toHaveBeenCalled();
  });

  test("should handle database errors gracefully", async () => {
    prisma.departamento.findMany.mockRejectedValue(
      new Error("Database connection failed"),
    );

    await expect(listDepartamentos()).rejects.toThrow(
      "Database connection failed",
    );
  });
});
