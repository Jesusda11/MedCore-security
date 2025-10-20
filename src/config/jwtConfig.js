const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  return jwt.sign(
    process.env.JWT_SECRET,
    { id: user.id, email: user.email, role: user.role, fullname: user.fullname },
    { expiresIn: "3h" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" } 
  );
};

module.exports = { generateAccessToken, generateRefreshToken };
