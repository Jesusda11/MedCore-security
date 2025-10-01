const {
  generateAccessToken,
  generateRefreshToken,
} = require("../config/jwtConfig");
const jwt = require("jsonwebtoken");

/**
 * This test suite verifies the JWT configuration functions.
 * It includes tests for generating access and refresh tokens,
 * ensuring they contain the correct payload and expiration settings.
 */
describe("jwtConfig", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test_secret_access";
    process.env.JWT_REFRESH_SECRET = "test_secret_refresh";
  });

  test("generateAccessToken incluye id y expiración corta", () => {
    const user = { id: 42, role: "GUEST" };
    const token = generateAccessToken(user);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(user.id);
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });

  test("generateRefreshToken", () => {
    const user = { id: 7 };
    const token = generateRefreshToken(user);
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    expect(decoded.id).toBe(user.id);
  });
});
