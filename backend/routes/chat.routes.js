import express from "express";
import auth from "../auth.js";
import Message from "../models/Message.js";
import uploadCloud from "../utils/cloudinary.js";

const router = express.Router();




/* ================================
   7) GET UNSEEN MESSAGE COUNT (สำหรับ Layout Navbar)
================================ */
router.get("/unseen-count", auth, async (req, res) => {
    try {
        const userId = req.user._id; 
        
        if (!userId) {
             console.error("User ID missing in unseen-count request.");
             return res.status(401).json({ message: "User not authenticated." });
        }

        // ⭐ การแก้ไข/ตรวจสอบ: แปลง userId เป็น string ก่อนใช้ในการ Query (บางครั้งช่วย Mongoose ได้)
        const targetId = userId.toString(); 

        const count = await Message.countDocuments({
            // ใช้ targetId ที่เป็น String หรือใช้ ObjectId() เพื่อความปลอดภัย
            to: targetId, 
            seen: false,
        });

        res.json({ count }); 
    } catch (err) {
        // ⭐ พิมพ์ Error เต็ม ๆ เพื่อ Debug
        console.error("CRITICAL DB ERROR IN /unseen-count:", err); 
        // ถ้าเป็น CastError หรือ Type Error ให้ส่ง 400 Bad Request แทน 500
        if (err.name === 'CastError' || err.name === 'TypeError') {
            return res.status(400).json({ message: "Invalid ID format in query." });
        }
        res.status(500).json({ message: "Server error during count." });
    }
});

/* ================================
   8) MARK ALL UNSEEN MESSAGES AS READ
================================ */
router.post("/mark-all-seen", auth, async (req, res) => {
    try {
        const userId = req.user._id;

        // อัปเดตข้อความทั้งหมดที่ส่งถึงผู้ใช้คนนี้ (to: userId) และยังไม่ได้อ่าน (seen: false)
        await Message.updateMany(
            { to: userId, seen: false },
            { $set: { seen: true, seenAt: new Date() } }
        );

        res.json({ success: true, message: "All messages marked as seen" });
    } catch (err) {
        console.error("Mark all seen error:", err);
        res.status(500).json({ message: "Error marking messages as seen" });
    }
});

/* ================================
   9) MARK MESSAGES FROM SPECIFIC USER AS READ
================================ */
router.post("/mark-as-seen/:fromId", auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const fromId = req.params.fromId;

        await Message.updateMany(
            { to: userId, from: fromId, seen: false },
            { $set: { seen: true, seenAt: new Date() } }
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: "Error" });
    }
});

/* ================================
   1) โหลดข้อความระหว่าง Owner 2 คน
================================ */
router.get("/:id", auth, async (req, res) => {
  try {
    const userA = req.user._id;
    const userB = req.params.id;
    const targetUserB = userB.toString(); 

    // 1. อัปเดตสถานะการอ่าน (Seen)
    await Message.updateMany(
      { to: userA, from: targetUserB, seen: false },
      { $set: { seen: true, seenAt: new Date() } }
    );

    // 2. ดึงข้อความ
    const msgs = await Message.find({
      $or: [
        { from: userA, to: targetUserB },
        { from: targetUserB, to: userA },
      ],
    }).sort({ pinnedAt: -1, createdAt: 1 }); 

    // 🎯 เนื่องจากเราลบ Logic การแปลง URL ออกจากไฟล์นี้แล้ว 
    // หากคุณได้แก้ไข Message.js ให้ใช้ Virtual Property แล้ว โค้ดนี้จะใช้ได้ทันที
    
    res.json(msgs); 
  } catch (err) {
    console.error("Load chat error:", err);
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
// ✅ 4. ใช้ uploadCloud (Cloudinary Multer Instance) แทน upload เดิม
router.post("/image", auth, uploadCloud.single("file"), async (req, res) => {
  try {
    // Multer Cloudinary ได้จัดการอัปโหลดไปยัง Cloudinary แล้ว
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { to } = req.body;

    if (!to || to === "undefined") {
      return res.status(400).json({ message: "Invalid 'to' user" });
    }

    // ✅ 5. ดึง Full URL จาก req.file.path (Cloudinary URL)
    const fullImageUrl = req.file.path; 

    // ⭐ 1. สร้างและบันทึกข้อความ (บันทึก Full URL ของ Cloudinary ลง DB)
    const msg = await Message.create({
      from: req.user._id,
      to,
      image: fullImageUrl, // ⭐ บันทึก Full URL แทน Path สัมพัทธ์
      type: "image",
      seen: false,
    });

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



export default router;