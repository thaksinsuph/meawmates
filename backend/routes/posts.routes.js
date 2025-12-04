import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import auth from "../auth.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Report from "../models/Report.js";


const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⭐ Fix path (ไม่แตะ base64)
const fixPath = (p) => {
  if (!p) return null;
  if (p.startsWith("data:")) return p;
  return "/" + p.replace(/\\/g, "/").replace(/^\//, "");
};

/* ======================================================
   1) GET SAVED POSTS
====================================================== */
router.get("/saved/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await Post.find({ _id: { $in: user.savedPosts } })
      .populate("author", "name avatar")
      .sort({ createdAt: -1 });

    const formatted = await Promise.all(
      posts.map(async (p) => ({
        _id: p._id,
        content: p.content,
        image: fixPath(p.image),
        likes: p.likes,
        author: p.author?.name,
        avatar: p.author?.avatar ? fixPath(p.author.avatar) : null,
        savedCount: await User.countDocuments({ savedPosts: p._id }),
      }))
    );

    res.json(formatted);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   2) GET ALL POSTS (แก้เวอร์ชันถูกต้อง)
====================================================== */
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name avatar")
      .sort({ createdAt: -1 });

    // ⭐ โหลด user เพื่อดูว่าเซฟโพสต์ไหนบ้าง
    const user = await User.findById(req.user._id);
    const savedList = user.savedPosts.map(id => id.toString());

    const formatted = await Promise.all(
      posts.map(async (p) => ({
        ...p._doc,

        image: fixPath(p.image),

        // ⭐ POST นี้ถูก save หรือไม่
        isSaved: savedList.includes(p._id.toString()),

        // ⭐ จำนวน save ที่แท้จริง
        savedCount: await User.countDocuments({ savedPosts: p._id }),

        author: {
          _id: p.author?._id,
          name: p.author?.name,
          avatar: p.author?.avatar ? fixPath(p.author.avatar) : null,
        },
      }))
    );

    res.json(formatted);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   GET ONE POST (เพิ่ม userId ใน comments)
====================================================== */
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "name avatar email"
    );

    if (!post) return res.status(404).json({ message: "Post not found" });

    const user = await User.findById(req.user._id);
    const isSaved = user.savedPosts.map(id => id.toString()).includes(post._id.toString());
    const savedCount = await User.countDocuments({ savedPosts: post._id });

    const formatted = {
      ...post._doc,
      image: fixPath(post.image),
      isSaved,
      savedCount,
      author: {
        ...post.author._doc,
        avatar: fixPath(post.author.avatar),
      },
      comments: post.comments.map((c) => ({
        _id: c._id,
        content: c.content,
        author: c.author,
        avatar: c.avatar,
        userId: c.userId,
        date: c.date
      }))
    };

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



/* ======================================================
   3.5) GET POSTS BY USER ID
====================================================== */
router.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate("author", "name avatar")
      .sort({ createdAt: -1 });

    const formatted = posts.map((p) => ({
      ...p._doc,
      image: fixPath(p.image),
      author: {
        ...p.author._doc,
        avatar: fixPath(p.author.avatar),
      },
    }));

    res.json(formatted);
  } catch (err) {
    console.error("GET USER POSTS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   4) CREATE POST
====================================================== */
router.post("/", auth, async (req, res) => {
  try {
    const { content, image } = req.body;
    let imagePath = "";

    if (image && image.startsWith("data:image")) {
      const filename = `/uploads/post_${Date.now()}.png`;
      const base64 = image.replace(/^data:image\/\w+;base64,/, "");

      fs.writeFileSync(
        path.join(__dirname, "..", filename),
        Buffer.from(base64, "base64")
      );

      imagePath = filename;
    }

    const post = new Post({
      author: req.user._id,
      content,
      image: imagePath,
      likes: [],
      comments: [],
    });

    await post.save();
    const populated = await post.populate("author", "name avatar");

    populated.author.avatar = fixPath(populated.author.avatar);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   5) LIKE / UNLIKE + PREVENT DUP NOTIFICATION
====================================================== */
router.post("/:id/like", auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId).populate("author", "_id name avatar");
    if (!post) return res.status(404).json({ message: "Post not found" });

    const me = await User.findById(userId);
    const author = await User.findById(post.author._id);

    const alreadyLiked = post.likes.includes(userId);

    // UNLIKE
    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
      await post.save();
      return res.json({ message: "Unliked", likes: post.likes.length });
    }

    // LIKE
    post.likes.push(userId);
    await post.save();

    // ⭐ Prevent duplicate LIKE notifications
    const exists = author.notifications.some(
      (n) =>
        n.type === "like" &&
        n.fromUser.toString() === userId.toString() &&
        n.postId?.toString() === postId.toString()
    );

    if (!exists && author._id.toString() !== userId.toString()) {
      author.notifications.push({
        type: "like",
        fromUser: me._id,
        message: `${me.name} liked your post `,
        postId,
        read: false,
        createdAt: new Date(),
      });
      await author.save();
    }

    res.json({ message: "Liked", likes: post.likes.length });
  } catch (err) {
    console.error("LIKE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ======================================================
   6) COMMENT + PREVENT DUP COMMENT NOTIFICATION
====================================================== */
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) return res.status(400).json({ message: "Comment cannot be empty" });

    const post = await Post.findById(req.params.id).populate("author", "_id name avatar");
    if (!post) return res.status(404).json({ message: "Post not found" });

    const me = await User.findById(req.user._id);
    const author = await User.findById(post.author._id);

    // เพิ่มคอมเมนต์
    post.comments.push({
      author: me.name,
      userId: me._id,
      avatar: me.avatar,
      content,
      date: new Date(),
    });

    await post.save();

    // ⭐ Prevent duplicate comment notifications
    const exists = author.notifications.some(
      (n) =>
        n.type === "comment" &&
        n.fromUser.toString() === me._id.toString() &&
        n.postId?.toString() === post._id.toString() &&
        n.message.includes(content)
    );

    if (!exists && author._id.toString() !== me._id.toString()) {
      author.notifications.push({
        type: "comment",
        fromUser: me._id,
        message: `${me.name} commented: "${content}" `,
        postId: post._id,
        read: false,
        createdAt: new Date(),
      });
      await author.save();
    }

    res.json(post.comments);
  } catch (err) {
    console.error("COMMENT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   7) SAVE / UNSAVE
====================================================== */
router.post("/:id/save", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const pid = req.params.id.toString();

    const list = user.savedPosts.map((x) => x.toString());
    const saved = !list.includes(pid);

    if (saved) user.savedPosts.push(pid);
    else user.savedPosts = user.savedPosts.filter((x) => x.toString() !== pid);

    await user.save();

    // ⭐ นับจำนวนคนที่ save post นี้
    const savedCount = await User.countDocuments({ savedPosts: pid });

    // ⭐ ส่งกลับไปให้ frontend
    res.json({ 
      saved,
      savedCount 
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* ======================================================
   REPORT POST → ส่งถึง Admin
====================================================== */
router.post("/:id/report", auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const postId = req.params.id;

    await Report.create({
      type: "post",
      postId,
      reporter: req.user._id,
      reason,
      status: "pending"
    });

    res.json({ success: true, message: "Report sent to admin." });
  } catch (err) {
    console.error("REPORT POST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});


/* ======================================================
   8) DELETE COMMENT
====================================================== */
router.delete("/:postId/comment/:commentId", auth, async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // ⭐ Allow admin OR comment owner
    if (
      String(comment.userId) !== String(req.user._id) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    comment.deleteOne();
    await post.save();

    res.json({ success: true, comments: post.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* ======================================================
   REPORT COMMENT → ส่งถึง Admin
====================================================== */
router.post("/:postId/comment/:commentId/report", auth, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { reason } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    await Report.create({
      type: "comment",
      postId,
      commentId,
      commentText: comment.content,   // ⭐ สำคัญมาก ต้องมี
      reporter: req.user._id,
      reason,
      status: "pending"
    });

    res.json({ success: true, message: "Comment report sent to admin." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



/* ======================================================
   10) DELETE POST
====================================================== */
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ❗ ลบได้เฉพาะคนที่เป็นเจ้าของโพสต์เท่านั้น
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await post.deleteOne();

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE POST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});


export default router;
