// notifications.routes.js
import express from "express";
import auth from "../auth.js";
import Notification from "../models/Notification.js";

const router = express.Router();

/* ======================================================
   GET ALL NOTIFICATIONS
   - include postId
   - include fromUser (name, avatar)
====================================================== */
router.get("/", auth, async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user._id })
      .populate("fromUser", "name avatar")   // ⭐ แสดงชื่อ + avatar
      .populate("post", "_id")               // ⭐ ให้ postId ไปหน้าโพสต์ได้
      .sort({ createdAt: -1 });

    res.json(notifs);
  } catch (err) {
    console.error("❌ GET /noti error:", err);
    res.status(500).json({ message: "Cannot load notifications" });
  }
});

/* ======================================================
   GET UNSEEN COUNT
====================================================== */
router.get("/count", auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      seen: false,
    });

    res.json({ count });
  } catch (err) {
    console.error("❌ GET /noti/count error:", err);
    res.status(500).json({ message: "Cannot count notifications" });
  }
});

/* ======================================================
   MARK ALL AS SEEN
   - when user opens dropdown, clear badge
====================================================== */
router.post("/seen", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, seen: false },
      { seen: true }
    );

    res.json({ success: true });

  } catch (err) {
    console.error("❌ POST /noti/seen error:", err);
    res.status(500).json({ message: "Cannot update notifications" });
  }
});

export default router;
