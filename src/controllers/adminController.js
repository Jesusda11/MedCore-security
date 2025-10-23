const { importUsersFromCSV } = require("../services/importService");
const {
  upload: uploadToStorage,
  remove: removeFromStorage,
} = require("../services/storageService");
const path = require("path");

const uploadUsersCSV = async (req, res) => {
  let uploadedFile = null;

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Debes subir un archivo CSV válido" });
    }

    const ext = path.extname(req.file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    uploadedFile = await uploadToStorage({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      filename,
      mimetype: req.file.mimetype,
      category: "uploads",
    });

    const creatorId = req.user?.id || null;
    const token = req.headers.authorization?.split(" ")[1] || null;

    const result = await importUsersFromCSV(
      uploadedFile.filePath,
      uploadedFile.storedKey,
      req.file.buffer,
      creatorId,
      token,
    );

    if (uploadedFile.storedKey) {
      await removeFromStorage({
        storedKey: uploadedFile.storedKey,
        filePath: uploadedFile.filePath,
      });
    }

    return res.json({
      message: "Importación completada",
      usuariosImportados: result.createdUsers,
      inserted: result.inserted,
      skipped: result.skipped,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Error importando usuarios:", error);

    if (uploadedFile && uploadedFile.storedKey) {
      try {
        await removeFromStorage({
          storedKey: uploadedFile.storedKey,
          filePath: uploadedFile.filePath,
        });
      } catch (_) {}
    }

    return res.status(500).json({
      message: "Error importando usuarios",
      error: error.message,
    });
  }
};

module.exports = { uploadUsersCSV };
