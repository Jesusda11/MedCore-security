const mockPrismaInstance = {
  especializacion: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  departamento: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  users: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
};

jest.mock("../generated/prisma", () => {
  return {
    PrismaClient: jest.fn(() => mockPrismaInstance),
  };
});

const {
  listEspecialidades,
  listEspecialidadesByDepartamento,
  deleteEspecialidad,
} = require("../services/especialidadService");

/**
 * Integration tests for Specialization Service
 * Tests specialization listing, filtering by department, and deletion with cascade.
 */
describe("Especialidad Service tests", () => {
  const prisma = mockPrismaInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should list all specializations with department information", async () => {
    const mockEspecialidades = [
      {
        id: 1,
        nombre: "cardiología",
        departamentoId: 1,
        departamento: { nombre: "medicina interna" },
      },
      {
        id: 2,
        nombre: "pediatría",
        departamentoId: 2,
        departamento: { nombre: "pediatría" },
      },
      {
        id: 3,
        nombre: "neurología",
        departamentoId: 3,
        departamento: { nombre: "neurociencias" },
      },
    ];

    prisma.especializacion.findMany.mockResolvedValue(mockEspecialidades);

    const result = await listEspecialidades();

    expect(prisma.especializacion.findMany).toHaveBeenCalledWith({
      include: {
        departamento: { select: { nombre: true } },
      },
      orderBy: { nombre: "asc" },
    });
    expect(result).toHaveLength(3);
    expect(result[0].departamento.nombre).toBe("medicina interna");
  });

  test("should filter specializations by department ID", async () => {
    const departmentId = 1;
    const mockEspecialidades = [
      {
        id: 1,
        nombre: "cardiología",
        departamentoId: 1,
        departamento: { nombre: "medicina interna" },
      },
      {
        id: 4,
        nombre: "gastroenterología",
        departamentoId: 1,
        departamento: { nombre: "medicina interna" },
      },
    ];

    prisma.especializacion.count.mockResolvedValue(2);
    prisma.especializacion.findMany.mockResolvedValue(mockEspecialidades);

    const result = await listEspecialidadesByDepartamento({
      departamentoId: departmentId,
      page: 1,
      limit: 20,
    });

    expect(prisma.especializacion.findMany).toHaveBeenCalled();
    expect(result.especialidades).toHaveLength(2);
    expect(result.especialidades[0].departamentoId).toBe(departmentId);
  });

  test("should filter specializations by department name", async () => {
    const departmentName = "pediatría";
    const mockDepartamento = {
      id: 2,
      nombre: "pediatría",
    };

    const mockEspecialidades = [
      {
        id: 2,
        nombre: "pediatría general",
        departamentoId: 2,
        departamento: { nombre: "pediatría" },
      },
      {
        id: 5,
        nombre: "neonatología",
        departamentoId: 2,
        departamento: { nombre: "pediatría" },
      },
    ];

    prisma.departamento.findFirst.mockResolvedValue(mockDepartamento);
    prisma.especializacion.count.mockResolvedValue(2);
    prisma.especializacion.findMany.mockResolvedValue(mockEspecialidades);

    const result = await listEspecialidadesByDepartamento({
      departamentoNombre: departmentName,
      page: 1,
      limit: 20,
    });

    expect(prisma.departamento.findFirst).toHaveBeenCalled();
    expect(result.especialidades).toHaveLength(2);
  });

  test("should delete specialization and update related users", async () => {
    const especializacionId = 1;
    const mockEspecializacion = {
      id: especializacionId,
      nombre: "cardiología",
      departamentoId: 1,
    };

    const mockUsers = [
      { id: 10, fullname: "Dr. Juan", especializacionId: 1 },
      { id: 11, fullname: "Dra. María", especializacionId: 1 },
    ];

    prisma.especializacion.findUnique.mockResolvedValue(mockEspecializacion);
    prisma.users.findMany.mockResolvedValue(mockUsers);
    prisma.users.updateMany.mockResolvedValue({ count: 2 });
    prisma.especializacion.delete.mockResolvedValue(mockEspecializacion);

    const result = await deleteEspecialidad(especializacionId);

    expect(prisma.especializacion.findUnique).toHaveBeenCalled();
    expect(prisma.especializacion.delete).toHaveBeenCalled();
    expect(result.message).toContain("eliminada correctamente");
  });

  test("should handle pagination correctly", async () => {
    const page = 2;
    const limit = 10;
    const mockEspecialidades = Array.from({ length: 10 }, (_, i) => ({
      id: i + 11,
      nombre: `especialidad ${i + 11}`,
      departamentoId: 1,
      departamento: { nombre: "medicina interna" },
    }));

    prisma.especializacion.count.mockResolvedValue(50);
    prisma.especializacion.findMany.mockResolvedValue(mockEspecialidades);

    const result = await listEspecialidadesByDepartamento({
      departamentoId: 1,
      page: page,
      limit: limit,
    });

    const callArgs = prisma.especializacion.findMany.mock.calls[0][0];
    expect(callArgs.skip).toBe((page - 1) * limit);
    expect(callArgs.take).toBe(limit);
  });
});
