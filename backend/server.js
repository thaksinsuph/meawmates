// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ⭐ OAuth Package
import session from "express-session";
import passport from "passport";

// ⭐ โหลด .env ก่อน
dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

console.log("🔍 FRONTEND_URL =", FRONTEND_URL);
console.log("🔍 JWT_SECRET =", process.env.JWT_SECRET);

// Fix dirname (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⭐ Import OAuth Strategies
import "./auth/google.js";
import "./auth/facebook.js";

// ⭐ Import Routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import postRoutes from "./routes/posts.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import petRoutes from "./routes/pets.routes.js";
import matchingRoutes from "./routes/matching.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import notiRoutes from "./routes/notifications.routes.js";
import reportRoutes from "./routes/report.routes.js";

const app = express();

/* ======================================================
      CORS (รองรับ Credential + OAuth)
====================================================== */
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

/* ======================================================
      JSON Parser
====================================================== */
app.use(express.json({ limit: "20mb", extended: true }));

/* ======================================================
      Session สำหรับ OAuth
====================================================== */
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* ======================================================
      Static File Uploads
====================================================== */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads/chat", express.static(path.join(__dirname, "uploads/chat")));

/* ======================================================
      MongoDB Connection
====================================================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ======================================================
      NORMAL API ROUTES
====================================================== */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/noti", notiRoutes);
app.use("/api/reports", reportRoutes);

/* ======================================================
      Test Route
====================================================== */
app.get("/", (req, res) => {
  res.send("🐾 MeowMates API is running successfully!");
});

/* ======================================================
      404 Not Found
====================================================== */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found 🐾" });
});

/* ======================================================
      Start Server
====================================================== */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
