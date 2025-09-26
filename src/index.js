const database = require('./config/database');
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./router/routes');
require('dotenv').config();
const port = process.env.PORT || 3000;

const app = express();

// Middleware : POST,PUT,PATCH
app.use(bodyParser.json());
app.use('/api/v1', routes)



app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    database();
});
