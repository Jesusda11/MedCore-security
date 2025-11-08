const mockPrismaInstance = {
  users: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock("../generated/prisma", () => {
  return {
    PrismaClient: jest.fn(() => mockPrismaInstance),
  };
});

jest.mock("bcrypt");

const {
  createUserBase,
  getBaseUserById,
  updateUserBase,
  toggleUserStatus,
  searchUsers,
} = require("../services/userService");
const bcrypt = require("bcrypt");

/**
 * Integration tests for User Service
 * Covers user creation, retrieval, updating, status toggling, and searching.
 */
describe("User Service tests", () => {
  const prisma = mockPrismaInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.hash = jest.fn().mockResolvedValue("hashed_password");
  });

  test("should create a new user with valid data", async () => {
    const userData = {
      email: "doctor@hospital.com",
      current_password: "SecurePass123",
      fullname: "Dr. Juan Pérez",
      identificacion: "12345678",
      role: "MEDICO",
      phone: "5551234",
      date_of_birth: "1985-05-15",
    };

    const mockCreatedUser = {
      id: 1,
      ...userData,
      current_password: "hashed_password",
      status: "PENDING",
      createdById: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prisma.users.findFirst.mockResolvedValue(null);
    prisma.users.create.mockResolvedValue(mockCreatedUser);

    const result = await createUserBase(userData);

    expect(prisma.users.findFirst).toHaveBeenCalledWith({
      where: { email: userData.email },
    });
    expect(bcrypt.hash).toHaveBeenCalledWith(userData.current_password, 10);
    expect(prisma.users.create).toHaveBeenCalled();
    expect(result.email).toBe(userData.email);
    expect(result.fullname).toBe(userData.fullname);
  });

  test("should retrieve user by ID with complete information", async () => {
    const userId = 1;
    const mockUser = {
      id: userId,
      email: "nurse@hospital.com",
      fullname: "María González",
      identificacion: "87654321",
      role: "ENFERMERA",
      status: "ACTIVE",
      phone: "5555678",
      date_of_birth: new Date("1990-08-20"),
    };

    prisma.users.findUnique.mockResolvedValue(mockUser);

    const result = await getBaseUserById(userId);

    expect(prisma.users.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
      select: expect.any(Object),
    });
    expect(result.email).toBe(mockUser.email);
    expect(result.fullname).toBe(mockUser.fullname);
  });

  test("should update user information successfully", async () => {
    const userId = 1;
    const updateData = {
      fullname: "Dr. Juan Pérez Updated",
      phone: "5559999",
    };

    const existingUser = {
      id: userId,
      email: "doctor@hospital.com",
      fullname: "Dr. Juan Pérez",
      identificacion: "12345678",
      role: "MEDICO",
      status: "ACTIVE",
      phone: "5551234",
    };

    const updatedUser = {
      ...existingUser,
      ...updateData,
      updatedAt: new Date(),
    };

    prisma.users.findUnique.mockResolvedValue(existingUser);
    prisma.users.update.mockResolvedValue(updatedUser);

    const result = await updateUserBase(userId, updateData, 2);

    expect(prisma.users.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
    });
    expect(prisma.users.update).toHaveBeenCalled();
    expect(result.fullname).toBe(updateData.fullname);
    expect(result.phone).toBe(updateData.phone);
  });

  test("should toggle user status from ACTIVE to INACTIVE", async () => {
    const userId = 1;
    const mockUser = {
      id: userId,
      email: "user@hospital.com",
      status: "ACTIVE",
      role: "MEDICO",
    };

    const toggledUser = {
      ...mockUser,
      status: "INACTIVE",
      updatedAt: new Date(),
    };

    prisma.users.findUnique.mockResolvedValue(mockUser);
    prisma.users.update.mockResolvedValue(toggledUser);

    const result = await toggleUserStatus(userId, 2);

    expect(prisma.users.findUnique).toHaveBeenCalled();
    expect(prisma.users.update).toHaveBeenCalled();
    expect(result.status).toBe("INACTIVE");
  });

  test("should search users by query string", async () => {
    const searchQuery = "María";
    const mockUsers = [
      {
        id: 1,
        fullname: "María González",
        email: "maria@hospital.com",
        role: "ENFERMERA",
        status: "ACTIVE",
      },
      {
        id: 2,
        fullname: "María Rodríguez",
        email: "mrodriguez@hospital.com",
        role: "MEDICO",
        status: "ACTIVE",
      },
    ];

    prisma.users.findMany.mockResolvedValue(mockUsers);

    const result = await searchUsers(searchQuery);

    expect(prisma.users.findMany).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0].fullname).toContain("María");
    expect(result[1].fullname).toContain("María");
  });
});
