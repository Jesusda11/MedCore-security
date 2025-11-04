const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadUsersCSV } = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const isAdminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

const storage = multer.memoryStorage();

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
  isAdminMiddleware,
  upload.single("file"),
  uploadUsersCSV,
);

module.exports = router;
