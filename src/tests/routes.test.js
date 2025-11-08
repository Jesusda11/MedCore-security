jest.mock("bcrypt");
jest.mock("jsonwebtoken");

const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
const isAdminMiddleware = require("../middleware/adminMiddleware");

/**
 * Integration tests for Middleware Chain
 * Covers authentication and admin authorization middleware.
 */
describe("Middleware Chain tests", () => {
  let req, res, next;

  beforeAll(() => {
    process.env.JWT_SECRET = "test_secret_key";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
  });

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      headers: {},
      user: null,
      params: {},
      body: {},
    };

    const jsonMock = jest.fn();
    const statusMock = jest.fn(() => ({ json: jsonMock }));

    res = {
      status: statusMock,
      json: jsonMock,
    };

    next = jest.fn();
  });

  test("should successfully chain auth and admin middleware for admin user", () => {
    const mockAdminPayload = {
      id: 1,
      email: "admin@hospital.com",
      role: "ADMINISTRADOR",
      fullname: "Admin User",
    };

    req.headers.authorization = "Bearer admin_token";
    jwt.verify = jest.fn().mockReturnValue(mockAdminPayload);

    authMiddleware(req, res, next);
    expect(req.user).toEqual(mockAdminPayload);
    expect(next).toHaveBeenCalledTimes(1);

    next.mockClear();
    isAdminMiddleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("should block non-admin user at admin middleware", () => {
    const mockDoctorPayload = {
      id: 5,
      email: "doctor@hospital.com",
      role: "MEDICO",
      fullname: "Doctor User",
    };

    req.headers.authorization = "Bearer doctor_token";
    jwt.verify = jest.fn().mockReturnValue(mockDoctorPayload);

    authMiddleware(req, res, next);
    expect(req.user).toEqual(mockDoctorPayload);
    expect(next).toHaveBeenCalledTimes(1);

    next.mockClear();
    isAdminMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Acceso denegado. Solo administradores",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should block request with invalid token at auth middleware", () => {
    req.headers.authorization = "Bearer invalid_token";
    jwt.verify = jest.fn().mockImplementation(() => {
      throw new Error("Invalid token");
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Token inválido o expirado",
    });
    expect(next).not.toHaveBeenCalled();
    expect(req.user).toBeNull();
  });

  test("should block request without authorization header", () => {
    req.headers.authorization = undefined;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Token no proporcionado",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should handle expired token gracefully", () => {
    req.headers.authorization = "Bearer expired_token";

    const expiredError = new Error("Token expired");
    expiredError.name = "TokenExpiredError";

    jwt.verify = jest.fn().mockImplementation(() => {
      throw expiredError;
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Token inválido o expirado",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
