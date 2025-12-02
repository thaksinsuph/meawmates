import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import auth from "../auth.js";

const router = express.Router();

/* =====================================================
   ⭐ ROUTES THAT MUST COME FIRST (/me prefix)
===================================================== */

/* 📌 GET MY PROFILE */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* 📌 GET MY NOTIFICATIONS */
router.get("/me/notifications", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "notifications.fromUser",
      "name avatar"
    );

    const noti = user.notifications || [];
    res.json([...noti].reverse());
  } catch (err) {
    console.error("NOTI ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* 📌 MARK ALL NOTIFICATIONS AS READ */
router.post("/me/notifications/read", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    (user.notifications || []).forEach((n) => {
      n.read = true;
    });

    await user.save();

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("NOTI READ ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* 📌 CLEAR ALL NOTIFICATIONS */
router.post("/me/notifications/clear", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.notifications = [];
    await user.save();

    res.json({ message: "All notifications cleared" });
  } catch (err) {
    console.error("CLEAR NOTI ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* 📌 UPDATE MY PROFILE */
router.put("/me", auth, async (req, res) => {
  try {
    const { name, avatar, currentPassword, newPassword, bio } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "ต้องใส่รหัสผ่านปัจจุบัน" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    res.json({
      message: "Profile updated",
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   ⭐ ROUTES THAT USE :id — MUST COME AFTER /me ROUTES
===================================================== */

/* ⭐ FOLLOW USER */
router.post("/:id/follow", auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const meId = req.user._id.toString();

    if (targetId === meId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const me = await User.findById(meId);
    const target = await User.findById(targetId);

    if (!target) return res.status(404).json({ message: "User not found" });

    if (me.following.some((uid) => uid.toString() === targetId)) {
      return res.json({ message: "Already following" });
    }

    me.following.push(targetId);
    target.followers.push(meId);

    target.notifications.push({
      type: "follow",
      fromUser: meId,
      message: `${me.name} started following you`,
      read: false,
      createdAt: new Date(),
    });

    await me.save();
    await target.save();

    res.json({ message: "Followed successfully" });
  } catch (err) {
    console.error("FOLLOW ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ⭐ UNFOLLOW USER */
router.post("/:id/unfollow", auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const meId = req.user._id.toString();

    const me = await User.findById(meId);
    const target = await User.findById(targetId);

    if (!target) return res.status(404).json({ message: "User not found" });

    me.following = me.following.filter((uid) => uid.toString() !== targetId);
    target.followers = target.followers.filter(
      (uid) => uid.toString() !== meId
    );

    await me.save();
    await target.save();

    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    console.error("UNFOLLOW ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ⭐ GET FOLLOWERS */
router.get("/:id/followers", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "followers",
      "name avatar"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.followers);
  } catch (err) {
    console.error("FOLLOWERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ⭐ GET FOLLOWING */
router.get("/:id/following", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "following",
      "name avatar"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.following);
  } catch (err) {
    console.error("FOLLOWING ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ⭐ GET USER BY ID — MUST BE THE LAST ONE */
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "name avatar")
      .populate("following", "name avatar");

    if (!user) return res.status(404).json({ message: "User not found" });

    const followersId = user.followers.map((u) => u._id.toString());
    const followingId = user.following.map((u) => u._id.toString());

    res.json({
      ...user.toObject(),
      followersId,
      followingId,
    });
  } catch (err) {
    console.error("❌ GET USER ERROR:", err);
    res.status(400).json({ message: "Invalid user ID" });
  }
});

export default router;
