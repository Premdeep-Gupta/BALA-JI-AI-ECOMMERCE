import dotenv from "dotenv";
import path from "path";

// ✅ 1. Advanced ENV Loading (Security)
dotenv.config({ path: "./config/config.env" });

import app from "./app.js";
import { v2 as cloudinary } from "cloudinary";

console.log("🚀 INITIALIZING SERVER...");

// ✅ 2. Pro-Level Cloudinary Setup
const cloudinaryConfig = () => {
  const { CLOUDINARY_CLIENT_NAME, CLOUDINARY_CLIENT_API, CLOUDINARY_CLIENT_SECRET } = process.env;
  
  if (CLOUDINARY_CLIENT_NAME && CLOUDINARY_CLIENT_API && CLOUDINARY_CLIENT_SECRET) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLIENT_NAME,
      api_key: CLOUDINARY_CLIENT_API,
      api_secret: CLOUDINARY_CLIENT_SECRET,
    });
    console.log("☁️  Cloudinary: Connected Successfully");
  } else {
    console.error("❌ Cloudinary: Configuration Missing! Image uploads will fail.");
  }
};
cloudinaryConfig();

// ✅ 3. Graceful Shutdown (Crash Protection)
process.on("uncaughtException", (err) => {
  console.log(`❌ Error: ${err.message}`);
  console.log("Shutting down due to uncaught exception...");
  process.exit(1);
});

import { startCampaignScheduler } from "./utils/campaignScheduler.js";

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`🔥 SERVER LIVE ON: http://localhost:${PORT}`);
  console.log(`🛠️  MODE: ${process.env.NODE_ENV || 'development'}`);
  startCampaignScheduler();
});

// ✅ 4. Unhandled Promise Rejection Fix
process.on("unhandledRejection", (err) => {
  console.log(`❌ Error: ${err.message}`);
  console.log("Closing server due to unhandled promise rejection...");
  server.close(() => process.exit(1));
});