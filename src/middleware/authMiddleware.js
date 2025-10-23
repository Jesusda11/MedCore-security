const jwt = require("jsonwebtoken");
const { MS_SECURITY_CONFIG } = require("../config/environment");

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, MS_SECURITY_CONFIG.JWT_SECRET);
    req.user = decoded; // Guardamos la info del usuario en req.user
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};
