import express from "express";
import auth from "../auth.js";
import multer from "multer";
import Message from "../models/Message.js";

const router = express.Router();

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
   โหลดข้อความระหว่าง Owner 2 คน
================================ */
router.get("/:id", auth, async (req, res) => {
  try {
    const userA = req.user?._id;
    const userB = req.params?.id;

    console.log("🔍 LOAD CHAT:", { me: userA, other: userB });

    // 👉 กันค่าผิดพลาด (สาเหตุหลักของ CastError)
    if (!userA || !userB || userB === "undefined") {
      console.warn("❌ Invalid userId in chat request.");
      return res.status(400).json({ message: "Invalid userId" });
    }

    const msgs = await Message.find({
      $or: [
        { from: userA, to: userB },
        { from: userB, to: userA },
      ],
    }).sort({ pinned: -1, createdAt: 1 });

    res.json(msgs);
  } catch (err) {
    console.error("Load chat error", err);
    res.status(500).json({ message: "Load chat error" });
  }
});

/* ================================
   ส่งข้อความ Text
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
    });

    res.json(msg);
  } catch (err) {
    console.error("Send text error", err);
    res.status(500).json({ message: "Send text error" });
  }
});

/* ================================
   ส่งรูปจริง (image upload)
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
    });

    res.json(msg);
  } catch (err) {
    console.error("Send image error", err);
    res.status(500).json({ message: "Send image error" });
  }
});

/* ================================
   Pin message
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
        pinnedAt: pin ? new Date() : null,
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
   ลบข้อความเดี่ยว
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
   ลบห้องแชท (Owner → Owner)
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
