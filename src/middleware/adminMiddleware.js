module.exports = function isAdminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  if (req.user.role !== "ADMINISTRADOR") {
    return res.status(403).json({ message: "Acceso denegado. Solo administradores" });
  }

  next();
};
