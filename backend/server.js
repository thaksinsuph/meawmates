import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import passport from "passport";
import jwt from "jsonwebtoken";
import http from "http"; 
import { Server } from "socket.io"; 
import User from "./models/User.js";

dotenv.config();

// ----- FRONTEND ORIGINS (Render + Vercel + Local) -----
const FRONTEND_ORIGINS = [
  "http://localhost:5173",
  "https://meaw-mates.vercel.app", 
  "https://meawmates.vercel.app",    
  
  // Regex: รองรับ Preview URL ทั้งแบบมีขีดและไม่มีขีด
  /^https:\/\/(?:meaw-mates|meawmates)-.*\.vercel\.app$/, 
  /^https:\/\/(?:meaw-mates|meawmates)-.*-projects\.vercel\.app$/,

];

console.log("🔍 Allowed Origins =", FRONTEND_ORIGINS);

// Fix dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OAuth
import "./auth/google.js";
import "./auth/facebook.js";

const app = express();

// ⭐⭐ สร้าง HTTP Server จาก Express App
const server = http.createServer(app); 

/* ======================================================
      ⭐ SOCKET.IO SETUP (กำหนด CORS สำหรับ Socket) ⭐
====================================================== */
const io = new Server(server, {
    pingTimeout: 60000, 
    cors: {
        // ใช้ฟังก์ชัน CORS เดิมเพื่ออนุญาตทุก Origin
        origin: (origin, callback) => {
            if (!origin) return callback(null, true); 

            const allowed = FRONTEND_ORIGINS.some((rule) =>
                rule instanceof RegExp ? rule.test(origin) : rule === origin
            );

            if (allowed) callback(null, true);
            else {
                console.log("❌ Socket CORS Blocked:", origin);
                callback(new Error("CORS Blocked"));
            }
        },
        
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    },
    // 🎯 1. แก้ไข WebSocket Error: กำหนด Path และ Transports สำหรับ Production
    path: '/socket.io/', // ยืนยัน Path
    transports: ['websocket', 'polling'], // บังคับให้ใช้ WebSocket
});


/* ======================================================
      ⭐ SOCKET.IO LISTENERS (Real-time Chat) ⭐
====================================================== */
io.on('connection', (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`);
    
    // [1] เข้าร่วมห้อง (เมื่อ Client ส่ง user._id มา)
    socket.on('join', (userId) => {
        if (userId) {
            socket.join(userId); 
            console.log(`[SOCKET] User ${userId} joined room.`);
        }
    });
    
    // [2] ส่งข้อความ (เมื่อ Client กดส่งข้อความ)
    socket.on('chat:send', (messageData) => {
        // messageData ควรมี { to: receiverId, from: senderId, text: ..., image: ..., read: false, ... }
        
        // ⭐ ส่งข้อความไปยังห้องของผู้รับ (to)
        if (messageData.to) {
             io.to(messageData.to).emit('message:new', messageData);
        }

        // ⭐ ส่งข้อความกลับไปหาผู้ส่ง (from) เพื่อให้แน่ใจว่า UI อัปเดตพร้อมกัน
        if (messageData.from) {
             io.to(messageData.from).emit('message:new', messageData);
        }
    });

    // [3] ออกจากห้อง/ตัดการเชื่อมต่อ
    socket.on('disconnect', () => {
        console.log(`[SOCKET] User disconnected: ${socket.id}`);
    });
});
/* ====================================================== */

app.set("trust proxy", 1); // Required for Render Proxy

/* ======================================================
      CORS FIX (Express Middleware)
====================================================== */
// (Express CORS Middleware ยังคงต้องมี)
app.use(
  cors({
    origin: (origin, callback) => {
      // ... (CORS Logic เดิม)
      if (!origin) return callback(null, true);

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

// ... (ส่วน express.json, express.urlencoded, session, passport)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,          
      sameSite: "none",      
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
// 🎯 2. Static Files: จำเป็นสำหรับรูปภาพเก่าที่ยังอยู่ใน DB เป็น Path สัมพัทธ์
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
      Start Server (ใช้ server.listen)
====================================================== */
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => { 
  console.log(`🚀 HTTP Server running on port ${PORT}`);
  console.log(`💬 Socket.IO running on port ${PORT}`);
});