const database = require("./config/database");
const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./router/routes");
const cors = require("cors");
const { initialize } = require("./interceptors/auditInterceptor");
require("dotenv").config();

const port = process.env.PORT || 3000;
const app = express();

app.use(
  cors({
    origin: "*",
    credentials: false,
  }),
);

app.use(bodyParser.json());

app.use("/api/v1", routes);

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await database();
  // await initialize();
});
