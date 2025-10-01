const mockPrismaInstance = {
  users: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock("../generated/prisma", () => {
  return {
    PrismaClient: jest.fn(() => mockPrismaInstance),
  };
});

jest.mock("bcrypt");
jest.mock("../config/jwtConfig");

const { signIn } = require("../controllers/AuthController");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../config/jwtConfig");
const bcrypt = require("bcrypt");

const prisma = mockPrismaInstance;

/**
 * This test suite covers the AuthController's signIn function.
 * It includes tests for various scenarios such as missing fields,
 * invalid credentials, successful authentication, and error handling.
 * The tests ensure that the signIn function behaves correctly under different conditions.
 */
describe("AuthController.signIn", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    process.env.JWT_SECRET = "test_secret_access";
    process.env.JWT_REFRESH_SECRET = "test_secret_refresh";

    const jsonMock = jest.fn();
    const statusMock = jest.fn(() => ({ json: jsonMock }));

    res = {
      status: statusMock,
      json: jsonMock,
    };

    prisma.users.findUnique.mockClear();
    prisma.users.create.mockClear();
    prisma.users.update.mockClear();
    bcrypt.compare.mockClear();

    generateAccessToken.mockReturnValue("mock-access-token");
    generateRefreshToken.mockReturnValue("mock-refresh-token");
  });

  test("returns 400 when email is not present", async () => {
    req.body = { current_password: "password123" };
    await signIn(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  test("returns 400 when password is not present", async () => {
    req.body = { email: "test@example.com" };
    await signIn(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  test("returns 404 when user does not exist", async () => {
    req.body = { email: "any@example.com", current_password: "x" };
    prisma.users.findUnique.mockResolvedValue(null);
    await signIn(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  test("returns 401 when credentials are incorrect", async () => {
    req.body = { email: "user@example.com", current_password: "wrong" };
    prisma.users.findUnique.mockResolvedValue({
      id: 1,
      email: "user@example.com",
      current_password: "$2b$10$saltsimulatedhash",
      role: "MEDICO",
      status: "ACTIVE",
    });
    bcrypt.compare.mockResolvedValue(false);
    await signIn(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  test("returns tokens and 200 when credentials are correct", async () => {
    req.body = { email: "u2@example.com", current_password: "right" };
    const userRecord = {
      id: 10,
      email: "u2@example.com",
      current_password: "$2b$10$goodhash",
      role: "MEDICO",
      status: "ACTIVE",
    };
    prisma.users.findUnique.mockResolvedValue(userRecord);
    prisma.users.update.mockResolvedValue(userRecord);
    bcrypt.compare.mockResolvedValue(true);
    await signIn(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      }),
    );
  });

  test("handles internal server errors", async () => {
    req.body = { email: "error@example.com", current_password: "password" };
    prisma.users.findUnique.mockRejectedValue(new Error("Database error"));
    await signIn(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  test("handles bcrypt.compare errors", async () => {
    req.body = { email: "user@example.com", current_password: "password" };
    prisma.users.findUnique.mockResolvedValue({
      id: 1,
      email: "user@example.com",
      current_password: "$2b$10$hash",
      role: "MEDICO",
      status: "ACTIVE",
    });
    bcrypt.compare.mockRejectedValue(new Error("Bcrypt error"));
    await signIn(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });
});
