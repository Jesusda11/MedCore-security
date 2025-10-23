const fs = require("fs");
const path = require("path");
const { appendLog } = require("../services/storageService");
const { MS_SECURITY_CONFIG } = require("../config/environment");

const LOG_FILENAME = "massiveLoad.log";
const logFilePath = path.join(__dirname, "../logs", LOG_FILENAME);

async function writeLog(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;

  try {
    if (MS_SECURITY_CONFIG.VERCEL) {
      await appendLog(LOG_FILENAME, logLine);
    } else {
      const logDir = path.join(__dirname, "../logs");
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(logFilePath, logLine, "utf8");
    }
  } catch (error) {
    console.error("[Logger Error]", error.message);
    console.log(logLine);
  }
}

function logInfo(message) {
  return writeLog(`INFO: ${message}`).catch((err) => {
    console.error("[logInfo Error]", err);
  });
}

function logWarning(message) {
  return writeLog(`WARNING: ${message}`).catch((err) => {
    console.error("[logWarning Error]", err);
  });
}

function logError(message) {
  return writeLog(`ERROR: ${message}`).catch((err) => {
    console.error("[logError Error]", err);
  });
}

module.exports = {
  logInfo,
  logWarning,
  logError,
};
