// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "./models/User.js";

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

console.log("🔍 FRONTEND_URL =", FRONTEND_URL);

// Fix dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OAuth Strategies
import "./auth/google.js";
import "./auth/facebook.js";

// Routes
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
      ⭐ REQUIRED FOR RENDER (IMPORTANT)
====================================================== */
app.set("trust proxy", 1);

/* ======================================================
      CORS
====================================================== */
app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

/* ======================================================
      JSON Parser
====================================================== */
app.use(express.json({ limit: "20mb" }));

/* ======================================================
      SESSION (OAuth)
====================================================== */
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // ⭐ required on Render (HTTPS)
      sameSite: "none", // ⭐ required for cross-site cookies
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* ======================================================
      OPTIONAL JWT AUTH
====================================================== */
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("_id name email role savedPosts avatar");
  } catch {
    req.user = null;
  }
  next();
};

app.use(optionalAuth);

/* ======================================================
      Static Files
====================================================== */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads/chat", express.static(path.join(__dirname, "uploads/chat")));

/* ======================================================
      MongoDB
====================================================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ======================================================
      API ROUTES
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
      404
====================================================== */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found 🐾" });
});

/* ======================================================
      Start Server
====================================================== */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
