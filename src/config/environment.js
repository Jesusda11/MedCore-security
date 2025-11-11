/**
 * This file loads environment variables from a .env file and exports them as a configuration object.
 * It uses the dotenv package to manage environment variables.
 */
require("dotenv").config();

const IS_VERCEL =
  !!process.env.VERCEL &&
  process.env.VERCEL !== "false" &&
  process.env.VERCEL !== "0";

const MS_SECURITY_CONFIG = {
  DATABASE_URL: process.env.DATABASE_URL_MONGO || "",
  NODE_ENV: process.env.NODE_ENV || "development",
  VERCEL: IS_VERCEL,
  PORT: process.env.PORT || 3013,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(",") || [],
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMPT_SECURE: process.env.SMPT_SECURE === "true",
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  MS_PATIENT: process.env.MS_SECURITY,
};

module.exports = { MS_SECURITY_CONFIG };
