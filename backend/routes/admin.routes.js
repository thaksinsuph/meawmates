import express from "express";
import User from "../models/User.js";
import Pet from "../models/Pet.js";
import Post from "../models/Post.js";
import Report from "../models/Report.js";
import { verifyToken } from "../utils/verifyToken.js";
import { verifyAdmin } from "../utils/verifyAdmin.js";

const router = express.Router();

/* ============================================================
   USERS
============================================================ */

// list users
router.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

// update user
router.put("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
  const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
});

// ban / unban
router.put("/users/:id/ban", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { banned } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { banned },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("Ban toggle error:", err);
    res.status(500).json({ message: "Ban update failed" });
  }
});

// delete user
router.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

/* ============================================================
   PETS
============================================================ */

router.get("/pets", verifyToken, verifyAdmin, async (req, res) => {
  const pets = await Pet.find().populate("user", "name email");
  res.json(pets);
});

router.put("/pets/:id", verifyToken, verifyAdmin, async (req, res) => {
  const updated = await Pet.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
});

router.delete("/pets/:id", verifyToken, verifyAdmin, async (req, res) => {
  await Pet.findByIdAndDelete(req.params.id);
  res.json({ message: "Pet deleted" });
});

/* ============================================================
   POSTS
============================================================ */

router.get("/posts", verifyToken, verifyAdmin, async (req, res) => {
  const posts = await Post.find().populate("author", "name email avatar");
  res.json(posts);
});

router.put("/posts/:id", verifyToken, verifyAdmin, async (req, res) => {
  const updated = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
});

router.delete("/posts/:id", verifyToken, verifyAdmin, async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ message: "Post deleted" });
});

/* ============================================================
   SUMMARY
============================================================ */

router.get("/summary", verifyToken, verifyAdmin, async (req, res) => {
  const [users, pets, posts] = await Promise.all([
    User.countDocuments(),
    Pet.countDocuments(),
    Post.countDocuments(),
  ]);

  res.json({
    totalUsers: users,
    totalPets: pets,
    totalPosts: posts,
  });
});

/* ============================================================
   REPORT SYSTEM  (⭐ NEW ⭐)
============================================================ */

// 1) Get all reports
router.get("/reports", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "name email")
      .populate("postId", "content image author comments")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error("GET REPORTS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// 2) Update report status (reviewed / pending)
router.put("/reports/:id/status", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("UPDATE REPORT STATUS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// 3) Delete post related to report
router.delete("/reports/:id/post", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    await Post.findByIdAndDelete(report.postId);

    res.json({ message: "Post deleted by admin" });
  } catch (err) {
    console.error("DELETE POST FROM REPORT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// 4) Delete only the comment that was reported
router.delete("/reports/:id/comment", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report || !report.commentId)
      return res.status(404).json({ message: "Comment report not found" });

    const post = await Post.findById(report.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // remove comment from array
    post.comments = post.comments.filter(
      (c) => c._id.toString() !== report.commentId.toString()
    );
    await post.save();

    res.json({ message: "Comment deleted by admin" });
  } catch (err) {
    console.error("DELETE COMMENT FROM REPORT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});
// 5) Delete report itself (remove from admin UI)
router.delete("/reports/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Report removed" });
  } catch (err) {
    console.error("DELETE REPORT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
