const jwt = require("jsonwebtoken");
const { MS_SECURITY_CONFIG } = require("./environment");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullname: user.fullname,
    },
    MS_SECURITY_CONFIG.JWT_SECRET,
    { expiresIn: "3h" },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, MS_SECURITY_CONFIG.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

module.exports = { generateAccessToken, generateRefreshToken };
