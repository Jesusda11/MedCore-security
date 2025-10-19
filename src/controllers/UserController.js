const { userById } = require("../services/userService");

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.status(200).json({ ...user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getUserById };
