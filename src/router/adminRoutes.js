const express = require("express");
const multer = require("multer");
const path = require("path");
const { importUsersFromCSV } = require("../controllers/adminController");
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

//Validar que solo sea CSV
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
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Debes subir un archivo CSV válido" });
      }

      const creatorId = req.user?.id || null;
      const result = await importUsersFromCSV(req.file.path, creatorId);

      return res.json({
        message: `Proceso de importación finalizado`,
        inserted: result.inserted,
        skipped: result.skipped,
        errors: result.errors,
      });
    } catch (error) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "El archivo no puede superar los 60MB" });
      }
      if (error.message === "Solo se permiten archivos CSV") {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error importando usuarios:", error);
      return res.status(500).json({ message: "Error importando usuarios" });
    }
  },
);

module.exports = router;
