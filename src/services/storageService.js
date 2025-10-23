const path = require("path");
const fs = require("fs");
const { MS_SECURITY_CONFIG } = require("../config/environment");
const fsp = require("fs").promises;

let put, del, list;
try {
  ({ put, del, list } = require("@vercel/blob"));
} catch (_) {}

const LOCAL_UPLOADS_ROOT = path.join("uploads");
const LOCAL_LOGS_ROOT = path.join("src", "logs");

function ensureLocalDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Upload a file buffer or stream and return { url, storedKey, filePath }.
 * In serverless environments, uses Vercel Blob Storage.
 * In local environments, saves to local filesystem.
 */
async function upload({ buffer, originalname, filename, mimetype, category = "uploads" }) {
  const ext = path.extname(originalname || filename || "");
  const safeName =
    filename || `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  if (MS_SECURITY_CONFIG.VERCEL) {
    if (!put)
      throw new Error("Storage provider not available in serverless env");

    const blobFolder = category === "logs" ? "logs" : "uploads";
    const key = `${blobFolder}/${safeName}`;
    
    const { url } = await put(key, buffer, {
      access: "public",
      contentType: mimetype || "application/octet-stream",
      addRandomSuffix: false,
    });
    return { url, storedKey: key, filePath: url };
  }

  const localRoot = category === "logs" ? LOCAL_LOGS_ROOT : LOCAL_UPLOADS_ROOT;
  ensureLocalDir(localRoot);
  const filePath = path.join(localRoot, safeName);
  await fsp.writeFile(filePath, buffer);
  return { url: null, storedKey: safeName, filePath };
}

/**
 * Delete a previously stored file.
 * Accepts either a storedKey (blob path) or a local filePath.
 */
async function remove({ storedKey, filePath }) {
  try {
    if (MS_SECURITY_CONFIG.VERCEL && storedKey && del) {
      await del(storedKey);
      return true;
    }
    if (filePath) {
      await fsp.unlink(filePath);
      return true;
    }
  } catch (_) {}
  return false;
}

/**
 * Append content to a log file.
 * In Vercel, reads existing log, appends content, and re-uploads.
 * In local, uses appendFileSync.
 */
async function appendLog(logName, content) {
  if (MS_SECURITY_CONFIG.VERCEL) {
    if (!put) {
      console.error("Storage provider not available for logging");
      return false;
    }
    
    try {
      const key = `logs/${logName}`;
      let existingContent = "";
      try {
        if (typeof list === "function") {
          const { blobs } = await list({ prefix: key, limit: 1 });
          const found = Array.isArray(blobs)
            ? blobs.find((b) => b.pathname === key) || blobs[0]
            : null;
          if (found && found.url) {
            const resp = await fetch(found.url);
            if (resp.ok) {
              existingContent = await resp.text();
            }
          }
        }
      } catch (_) {
        // If error reading existing log, proceed with empty content
      }
      
      const newContent = existingContent + content;
      const buffer = Buffer.from(newContent, "utf8");
      
      await put(key, buffer, {
        access: "public",
        contentType: "text/plain",
        addRandomSuffix: false,
      });
      
      return true;
    } catch (error) {
      console.error("Error appending log in Vercel:", error);
      return false;
    }
  }

  ensureLocalDir(LOCAL_LOGS_ROOT);
  const logPath = path.join(LOCAL_LOGS_ROOT, logName);
  try {
    fs.appendFileSync(logPath, content, "utf8");
    return true;
  } catch (error) {
    console.error("Error appending log locally:", error);
    return false;
  }
}

/**
 * Read a file from storage.
 * Returns the file content as buffer.
 */
async function read({ storedKey, filePath, category = "uploads" }) {
  if (MS_SECURITY_CONFIG.VERCEL && storedKey) {
    try {
      if (!list) throw new Error("Blob list API not available");
      const { blobs } = await list({ prefix: storedKey, limit: 1 });
      const found = Array.isArray(blobs)
        ? blobs.find((b) => b.pathname === storedKey) || blobs[0]
        : null;
      if (!found || !found.url) {
        throw new Error(`Blob not found for key: ${storedKey}`);
      }
      const resp = await fetch(found.url);
      if (!resp.ok) {
        throw new Error(`Failed to fetch blob content (${resp.status})`);
      }
      const arrBuf = await resp.arrayBuffer();
      return Buffer.from(arrBuf);
    } catch (err) {
      throw new Error(
        `Error reading blob '${storedKey}': ${err?.message || String(err)}`,
      );
    }
  }
  
  if (filePath) {
    return await fsp.readFile(filePath);
  }
  
  throw new Error("No storedKey or filePath provided");
}

module.exports = { upload, remove, appendLog, read };
