const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async() => {
    try {
        const conn = await mongoose.connect(process.env.DATABASE_URL);
        console.log(`MongoDB Connected: ${conn.connection.host}`, conn.connection.name);
    } catch (error) { console.error(`Error: ${error.message}`); }
};

module.exports = connectDB;