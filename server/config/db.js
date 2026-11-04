const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

// Fix for Node.js / Windows DNS resolution issues with MongoDB Atlas SRV records
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // Continue if environment restricts custom DNS
}

const PRIMARY_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/studentDb";

// Standard non-SRV direct seedlist fallback for Atlas ams.lkbz26w cluster
// Completely bypasses SRV lookup (preventing querySrv ECONNREFUSED)
const FALLBACK_URI =
  "mongodb://MAXX:Maxxis123@ac-pznn0eb-shard-00-00.lkbz26w.mongodb.net:27017,ac-pznn0eb-shard-00-01.lkbz26w.mongodb.net:27017,ac-pznn0eb-shard-00-02.lkbz26w.mongodb.net:27017/studentDb?ssl=true&replicaSet=atlas-1wwyjn-shard-0&authSource=admin&retryWrites=true&w=majority";

async function connectDb() {
  try {
    await mongoose.connect(PRIMARY_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ Connected to MongoDB Atlas (Primary)");
  } catch (primaryErr) {
    console.warn("⚠️  Primary MongoDB connection failed (DNS/SRV issue):", primaryErr.message);

    if (PRIMARY_URI.includes("mongodb+srv://")) {
      console.log("🔄 Attempting direct replica set connection without SRV lookup...");
      try {
        await mongoose.connect(FALLBACK_URI, {
          serverSelectionTimeoutMS: 8000,
        });
        console.log("✅ Connected to MongoDB Atlas via direct replica set fallback");
        return;
      } catch (fallbackErr) {
        console.error("❌ Fallback MongoDB connection error:", fallbackErr.message);
      }
    }

    // Do NOT exit process immediately so server stays alive and can retry
    console.log("⏳ Will retry connecting to MongoDB in 5 seconds...");
    setTimeout(connectDb, 5000);
  }
}

module.exports = connectDb;
