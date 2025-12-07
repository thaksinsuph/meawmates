import express from "express";
import auth from "../auth.js";
import multer from "multer";
import Message from "../models/Message.js";

const router = express.Router();

// 🚨 หมายเหตุ: หาก Backend ของคุณมีการจัดการ Socket.IO ที่ซับซ้อน
// คุณอาจจะต้อง Import ตัวแปร 'io' เข้ามาในไฟล์นี้เพื่อใช้ io.to().emit()
// แต่ในโค้ดนี้ เราจะใช้ Response JSON เพื่อให้ Frontend อัปเดตตัวเอง
// และถือว่า Backend จัดการ Socket Emit หลังจาก API Response ถูกส่งแล้ว (ตามแนวทางที่อธิบายไปก่อนหน้า)

/* ================================
   Multer สำหรับเก็บรูปแชท
================================ */
const storage = multer.diskStorage({
  destination: "uploads/chat",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* ================================
   1) โหลดข้อความระหว่าง Owner 2 คน
      - อัปเดตสถานะ 'Seen'
================================ */
router.get("/:id", auth, async (req, res) => {
  try {
    const userA = req.user?._id;
    const userB = req.params?.id;

    console.log("🔍 LOAD CHAT:", { me: userA, other: userB });

    // 👉 กันค่าผิดพลาด
    if (!userA || !userB || userB === "undefined") {
      console.warn("❌ Invalid userId in chat request.");
      return res.status(400).json({ message: "Invalid userId" });
    }

    // ⭐ 1. อัปเดตสถานะการอ่าน (Seen)
    // ตั้งค่าข้อความทั้งหมดที่ส่งมาถึงเรา (to: userA) และยังไม่ได้อ่าน (seen: false) ให้เป็นอ่านแล้ว
    await Message.updateMany(
      { to: userA, from: userB, seen: false },
      { $set: { seen: true, seenAt: new Date() } }
    );

    // 2. ดึงข้อความ
    const msgs = await Message.find({
      $or: [
        { from: userA, to: userB },
        { from: userB, to: userA },
      ],
    }).sort({ pinnedAt: -1, createdAt: 1 }); 

    res.json(msgs);
  } catch (err) {
    console.error("Load chat error", err);
    res.status(500).json({ message: "Load chat error" });
  }
});

/* ================================
   2) ส่งข้อความ Text
================================ */
router.post("/text", auth, async (req, res) => {
  try {
    const { to, text } = req.body;

    if (!to || to === "undefined") {
      return res.status(400).json({ message: "Invalid 'to' user" });
    }

    const msg = await Message.create({
      from: req.user._id,
      to,
      text,
      type: "text",
      seen: false, // ⭐ สำคัญ: ข้อความใหม่ต้องถูกตั้งค่าเป็นยังไม่ได้อ่าน
    });

    // 💡 หาก Backend มี Socket.IO: ควรส่ง io.to().emit('message:new', msg); ที่นี่
    
    res.json(msg);
  } catch (err) {
    console.error("Send text error", err);
    res.status(500).json({ message: "Send text error" });
  }
});

/* ================================
   3) ส่งรูปจริง (image upload)
================================ */
router.post("/image", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { to } = req.body;

    if (!to || to === "undefined") {
      return res.status(400).json({ message: "Invalid 'to' user" });
    }

    const url = "/uploads/chat/" + req.file.filename;

    const msg = await Message.create({
      from: req.user._id,
      to,
      image: url,
      type: "image",
      seen: false, // ⭐ สำคัญ: ข้อความใหม่ต้องถูกตั้งค่าเป็นยังไม่ได้อ่าน
    });

    // 💡 หาก Backend มี Socket.IO: ควรส่ง io.to().emit('message:new', msg); ที่นี่

    res.json(msg);
  } catch (err) {
    console.error("Send image error", err);
    res.status(500).json({ message: "Send image error" });
  }
});

/* ================================
   4) Pin message
================================ */
router.post("/pin", auth, async (req, res) => {
  try {
    const { id, pin } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Message ID required" });
    }

    const msg = await Message.findByIdAndUpdate(
      id,
      {
        pinnedAt: pin ? new Date() : null, // ใช้ pinnedAt ในการสลับสถานะ
      },
      { new: true }
    );

    res.json(msg);
  } catch (err) {
    console.error("Pin message error", err);
    res.status(500).json({ message: "Pin message error" });
  }
});

/* ================================
   5) ลบข้อความเดี่ยว
================================ */
router.delete("/msg/:id", auth, async (req, res) => {
  try {
    const msgId = req.params.id;

    if (!msgId) return res.status(400).json({ message: "Invalid message ID" });

    await Message.findByIdAndDelete(msgId);

    res.json({ success: true });
  } catch (err) {
    console.error("Delete message error", err);
    res.status(500).json({ message: "Delete message error" });
  }
});

/* ================================
   6) ลบห้องแชท (Owner → Owner)
================================ */
router.delete("/:userId", auth, async (req, res) => {
  try {
    const me = req.user?._id;
    const other = req.params?.userId;

    if (!me || !other || other === "undefined") {
      return res.status(400).json({ message: "Invalid userId" });
    }

    await Message.deleteMany({
      $or: [
        { from: me, to: other },
        { from: other, to: me },
      ],
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Delete chat error", err);
    res.status(500).json({ message: "Delete chat error" });
  }
});

/* ================================
   7) GET UNSEEN MESSAGE COUNT (สำหรับ Layout Navbar)
================================ */
router.get("/unseen-count", auth, async (req, res) => {
    try {
        const userId = req.user._id; // ตรวจสอบว่า req.user._id มีค่าจริง

        // ถ้า req.user ไม่มีค่า (ไม่น่าจะเกิดขึ้นถ้า auth ทำงาน) ให้กันไว้
        if (!userId) {
             console.error("User ID missing in unseen-count request.");
             return res.status(401).json({ message: "User not authenticated." });
        }

        const count = await Message.countDocuments({
            to: userId,
            seen: false,
        });

        res.json({ count }); 
    } catch (err) {
        // ⭐ เพิ่ม console.error เพื่อให้เห็น Error เต็ม ๆ ใน Server Log
        console.error("Unseen count database error:", err); 
        res.status(500).json({ message: "Server error during count." });
    }
});

export default router;