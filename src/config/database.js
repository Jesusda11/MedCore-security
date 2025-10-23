const mongoose = require("mongoose");
const { MS_SECURITY_CONFIG } = require("./environment");
require("dotenv").config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MS_SECURITY_CONFIG.DATABASE_URL);
    console.log(
      `MongoDB Connected: ${conn.connection.host}`,
      conn.connection.name,
    );
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

module.exports = connectDB;

