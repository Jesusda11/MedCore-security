const fs = require("fs");
const path = require("path");

const logFilePath = path.join(__dirname, "../logs/massiveLoad.log");

function writeLog(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFilePath, logLine, "utf8");
}

function logInfo(message) {
  writeLog(`INFO: ${message}`);
}

function logWarning(message) {
  writeLog(`WARNING: ${message}`);
}

function logError(message) {
  writeLog(`ERROR: ${message}`);
}

module.exports = {
  logInfo,
  logWarning,
  logError,
};
