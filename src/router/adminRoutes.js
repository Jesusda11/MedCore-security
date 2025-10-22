const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadUsersCSV } = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const isAdminMiddleware = require("../middleware/adminMiddleware");
const { auditInterceptor } = require("../interceptors/auditInterceptor");

const router = express.Router();

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

// Validar que solo sea CSV
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (ext === ".csv" && mime === "text/csv") {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos CSV"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 60 * 1024 * 1024 },
});

// Ruta para importar usuarios desde CSV (solo admin)
router.post(
  "/bulk-upload",
  authMiddleware,
  auditInterceptor,
  isAdminMiddleware,
  upload.single("file"),
  uploadUsersCSV 
);

module.exports = router;
