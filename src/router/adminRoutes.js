const express = require("express");
const multer = require("multer");
const path = require("path");
const { importUsersFromCSV } = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const isAdminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Ruta para importar usuarios desde CSV (solo admin)
router.post(
  "/bulk-upload",
  authMiddleware,     
  isAdminMiddleware,   
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Debes subir un archivo CSV" });
      }

      const result = await importUsersFromCSV(req.file.path);

      return res.json({
        message: "Usuarios importados correctamente",
        total: result.total,
        errors: result.errors,
      });
    } catch (error) {
      console.error("Error importando usuarios:", error);
      return res.status(500).json({ message: "Error importando usuarios" });
    }
  }
);

module.exports = router;
