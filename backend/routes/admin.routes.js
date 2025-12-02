import express from "express";
import User from "../models/User.js";
import Pet from "../models/Pet.js";
import Post from "../models/Post.js";
import { verifyToken } from "../utils/verifyToken.js";
import { verifyAdmin } from "../utils/verifyAdmin.js";

const router = express.Router();

/* ---------- Users ---------- */

// list users
router.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

// update user (name / role)
router.put("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
  const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
});

// ⭐ BAN / UNBAN USER
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

/* ---------- Pets ---------- */

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

/* ---------- Posts ---------- */

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

/* ---------- Summary ---------- */

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

export default router;
