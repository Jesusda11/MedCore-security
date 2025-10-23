const database = require("./config/database");
const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./router/routes");
const cors = require("cors");
const { initialize, disconnect } = require("./interceptors/auditInterceptor");
const { MS_SECURITY_CONFIG } = require("./config/environment");

const port = MS_SECURITY_CONFIG.PORT;
const app = express();

app.use(
  cors({
    origin: "*",
    credentials: false,
  }),
);

app.use(bodyParser.json());

app.use("/api/v1", routes);

process.on("SIGINT", async () => {
  await disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnect();
  process.exit(0);
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await database();
  await initialize();
});
