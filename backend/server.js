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

// ----- FRONTEND ORIGINS (Render + Vercel + Local) -----
const FRONTEND_ORIGINS = [
  "http://localhost:5173",
  "https://meaw-mates.vercel.app", // เผื่ออันเก่า
  "https://meawmates.vercel.app",    // ⭐ เพิ่มอันนี้ (ชื่อจริงไม่มีขีด)
  
  // Regex: รองรับ Preview URL ทั้งแบบมีขีดและไม่มีขีด
  /^https:\/\/meaw-mates-.*\.vercel\.app$/, 
  /^https:\/\/meawmates-.*\.vercel\.app$/,  // ⭐ เพิ่มบรรทัดนี้ (สำคัญมาก!)
];

console.log("🔍 Allowed Origins =", FRONTEND_ORIGINS);

// Fix dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OAuth
import "./auth/google.js";
import "./auth/facebook.js";

const app = express();

/* ======================================================
      ⭐ REQUIRED FOR RENDER PROXY
====================================================== */
app.set("trust proxy", 1);

/* ======================================================
      ⭐ CORS FIX (รองรับทุก Vercel Preview)
====================================================== */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // mobile apps / curl

      const allowed = FRONTEND_ORIGINS.some((rule) =>
        rule instanceof RegExp ? rule.test(origin) : rule === origin
      );

      if (allowed) callback(null, true);
      else {
        console.log("❌ CORS Blocked:", origin);
        callback(new Error("CORS Blocked"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

/* ======================================================
      JSON BODY
====================================================== */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

/* ======================================================
      ⭐ SESSION FIX (OAuth Cookies on HTTPS)
====================================================== */
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,          // must be true for HTTPS (Render)
      sameSite: "none",      // required for cross-origin cookies
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

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select(
      "_id name email role savedPosts avatar"
    );
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
  .catch((err) => console.error("❌ MongoDB error:", err));

/* ======================================================
      API Routes
====================================================== */
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import postRoutes from "./routes/posts.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import petRoutes from "./routes/pets.routes.js";
import matchingRoutes from "./routes/matching.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import notiRoutes from "./routes/notifications.routes.js";
import reportRoutes from "./routes/report.routes.js";

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
      Root Test
====================================================== */
app.get("/", (req, res) => {
  res.send("🐾 MeowMates API is running on Render!");
});

/* ======================================================
      404 Handler
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
