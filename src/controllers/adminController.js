const { importUsersFromCSV } = require("../services/importService");

const uploadUsersCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Debes subir un archivo CSV válido" });
    }

    const creatorId = req.user?.id || null;
    const token = req.headers.authorization?.split(" ")[1] || null;

    const result = await importUsersFromCSV(req.file.path, creatorId, token);

    return res.json({
      message: "Importación completada",
      usuariosImportados: result.createdUsers,
      inserted: result.inserted,
      skipped: result.skipped,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Error importando usuarios:", error);
    return res.status(500).json({
      message: "Error importando usuarios",
      error: error.message,
    });
  }
};

module.exports = { uploadUsersCSV };
