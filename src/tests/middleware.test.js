const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
const isAdminMiddleware = require("../middleware/adminMiddleware");

jest.mock("jsonwebtoken");

/**
 * This test suite covers the authentication and authorization middleware.
 * It includes tests for token validation, role-based access control, and error handling.
 * The tests ensure that the middleware behaves correctly under various scenarios.
 */
describe("Session Management Middleware", () => {
  let req, res, next;
  let originalEnv;

  beforeAll(() => {
    originalEnv = process.env;
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = "test_jwt_secret_key_2024";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret_key_2024";

    jest.resetAllMocks();

    req = {
      headers: {},
      user: null,
    };

    const jsonMock = jest.fn();
    const statusMock = jest.fn(() => ({ json: jsonMock }));

    res = {
      status: statusMock,
      json: jsonMock,
    };

    next = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Authentication Middleware - Token Valition", () => {
    test("should reject request with missing authorization header", () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Token no proporcionado",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should successfully authenticate with valid token", () => {
      const mockPayload = {
        id: 123,
        email: "user@example.com",
        role: "MEDICO",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      req.headers.authorization = "Bearer valid_token_123";
      jwt.verify.mockReturnValue(mockPayload);

      authMiddleware(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        "valid_token_123",
        process.env.JWT_SECRET,
      );
      expect(req.user).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should handle token expiration gracefully", () => {
      const expiredError = new Error("Token expired");
      expiredError.name = "TokenExpiredError";

      req.headers.authorization = "Bearer expired_token";
      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Token inválido o expirado",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle malformed token signature", () => {
      const signatureError = new Error("Invalid signature");
      signatureError.name = "JsonWebTokenError";

      req.headers.authorization = "Bearer malformed_token";
      jwt.verify.mockImplementation(() => {
        throw signatureError;
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Token inválido o expirado",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Admin Authorization Middleware & integración (esenciales)", () => {
    test("should deny access to MEDICO role", () => {
      req.user = {
        id: 2,
        email: "doctor@hospital.com",
        role: "MEDICO",
      };

      isAdminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Acceso denegado. Solo administradores",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should properly chain auth and admin middleware", () => {
      const mockPayload = {
        id: 1,
        email: "admin@hospital.com",
        role: "ADMINISTRADOR",
      };

      req.headers.authorization = "Bearer valid_admin_token";
      jwt.verify.mockReturnValue(mockPayload);

      authMiddleware(req, res, next);

      expect(req.user).toEqual(mockPayload);
      expect(next).toHaveBeenCalledTimes(1);

      next.mockClear();

      isAdminMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
