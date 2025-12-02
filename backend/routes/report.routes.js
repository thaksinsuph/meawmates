import express from "express";
import Report from "../models/Report.js";
import { verifyToken } from "../utils/verifyToken.js";

const router = express.Router();

// user report post
router.post("/", verifyToken, async (req, res) => {
  try {
    const { postId, reason, detail } = req.body;

    const report = await Report.create({
      reporter: req.user.id,
      post: postId,
      reason,
      detail,
    });

    res.status(201).json(report);
  } catch (err) {
    console.error("Create report error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
