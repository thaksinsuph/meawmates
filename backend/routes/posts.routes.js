import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import auth from "../auth.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Report from "../models/Report.js";
import upload from "../utils/cloudinary.js";
import { v2 as cloudinary } from 'cloudinary'; // ⭐ ต้อง import ตัวนี้เพิ่มเพื่อใช้ฟังก์ชัน uploader

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixPath = (p) => {
  if (!p) return null;
  if (p.startsWith("data:")) return p;
  if (p.startsWith("http")) return p; // ⭐ เพิ่มบรรทัดนี้ (Cloudinary URL)
  
  return "/" + p.replace(/\\/g, "/").replace(/^\/+/, "");
};

/* ======================================================
   1) GET SAVED POSTS (แก้ไขแล้ว)
====================================================== */
router.get("/saved/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate({
        path: "savedPosts",
        populate: { path: "author", select: "name avatar email" }
      });

    if (!user) return res.status(404).json({ message: "User not found" });

    const validPosts = user.savedPosts.filter(p => p && p._id);

    // ⭐⭐⭐ ต้องใช้ Promise.all เพื่อรอผลลัพธ์ของ User.countDocuments
    const formatted = await Promise.all(
      validPosts.map(async (p) => {
        // FIX 2: ถ้าคนโพสต์หายไป (null) ให้ใช้ข้อมูลสมมติแทน
        const author = p.author || { _id: "unknown", name: "Unknown User", avatar: null };

        // ⭐ คำนวณ Saved Count อย่างถูกต้อง
        const savedCount = await User.countDocuments({ savedPosts: p._id });

        return {
          _id: p._id,
          content: p.content,
          image: fixPath(p.image),
          likes: p.likes || [],
          comments: p.comments || [],
          createdAt: p.createdAt,
          
          author: {
            _id: author._id,
            name: author.name,
            avatar: author.avatar ? fixPath(author.avatar) : null
          },

          isSaved: true,
          savedCount: savedCount, // ⭐ ใส่ค่าที่คำนวณได้
        };
      })
    );
    
    // ⭐⭐ เรียงจากใหม่ไปเก่า
    formatted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(formatted);

  } catch (err) {
    console.error("SAVED POSTS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   2) GET ALL POSTS
====================================================== */
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name avatar")
      .sort({ createdAt: -1 });

    let savedList = [];
    if (req.user) {
      // ถ้า user login ให้ไปดึงรายการ saved ของเขามาเทียบ
      const user = await User.findById(req.user._id);
      if (user && user.savedPosts) {
        savedList = user.savedPosts.map(id => id.toString());
      }
    }

    const formatted = await Promise.all(
      posts.map(async (p) => {
         // Handle กรณี author เป็น null (user โดนลบ)
         const authorData = p.author || { _id: null, name: "Unknown User", avatar: null };
         
         return {
          ...p._doc,
          image: fixPath(p.image),
          isSaved: savedList.includes(p._id.toString()),
          savedCount: await User.countDocuments({ savedPosts: p._id }),
          author: {
            _id: authorData._id,
            name: authorData.name || "Unknown User",
            avatar: fixPath(authorData.avatar),
          },
        };
      })
    );

    res.json(formatted);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});


/* ======================================================
   GET ONE POST
====================================================== */
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "name avatar email"
    );

    if (!post) return res.status(404).json({ message: "Post not found" });

    let isSaved = false;
    let savedCount = await User.countDocuments({ savedPosts: post._id });

    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
         isSaved = user.savedPosts.map(id => id.toString()).includes(post._id.toString());
      }
    }

    const authorData = post.author || { _id: null, name: "Unknown User", avatar: null };

    const formatted = {
      ...post._doc,
      image: fixPath(post.image),
      isSaved,
      savedCount,
      author: {
        ...authorData._doc, // กรณีเป็น null อาจไม่มี _doc ระวังตรงนี้ แต่ถ้า mock object ข้างบนแล้วจะไม่มี _doc
        name: authorData.name,
        _id: authorData._id,
        avatar: fixPath(authorData.avatar),
      },
      comments: post.comments.map((c) => ({
        _id: c._id,
        content: c.content,
        author: c.author, // ชื่อคนคอมเมนต์ (String)
        avatar: fixPath(c.avatar),
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

    const formatted = posts.map((p) => {
      const authorData = p.author || { name: "Unknown", avatar: null };
      return {
        ...p._doc,
        image: fixPath(p.image),
        author: {
            ...authorData._doc,
            name: authorData.name,
            avatar: fixPath(authorData.avatar),
        },
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("GET USER POSTS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   4) CREATE POST (Support File AND Base64)
====================================================== */
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { content } = req.body;
    let imageUrl = "";

    // ✅ กรณีที่ 1: ส่งมาเป็นไฟล์ (FormData)
    if (req.file) {
      imageUrl = req.file.path;
    } 
    // ✅ กรณีที่ 2: ส่งมาเป็น Base64 (JSON) -> เราต้องสั่งอัปโหลดเอง
    else if (req.body.image && req.body.image.startsWith("data:image")) {
       try {
         const uploadRes = await cloudinary.uploader.upload(req.body.image, {
            folder: "meow-mates-avatars"
         });
         imageUrl = uploadRes.secure_url;
       } catch (uploadErr) {
         return res.status(400).json({ message: "Invalid image data" });
       }
    }
    // ✅ กรณีที่ 3: เป็น URL ธรรมดา (เช่นโพสต์ซ้ำ)
    else if (req.body.image) {
       imageUrl = req.body.image;
    }

    const post = new Post({
      author: req.user._id,
      content,
      image: imageUrl,
      likes: [],
      comments: [],
    });

    await post.save();
    
    // Populate และส่งกลับ
    const populated = await post.populate("author", "name avatar");
    const result = populated.toObject();
    
    // (Optional) Fix path avatar ถ้าจำเป็น
    if(result.author && result.author.avatar) {
        result.author.avatar = fixPath(result.author.avatar);
    }

    res.status(201).json(result);

  } catch (err) {
    console.error("Create Post Error:", err);
    res.status(500).json({ message: err.message });
  }
});
/* ======================================================
   5) LIKE / UNLIKE
====================================================== */
router.post("/:id/like", auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId).populate("author", "_id name avatar");
    if (!post) return res.status(404).json({ message: "Post not found" });

    const me = await User.findById(userId);
    // เช็คว่า author ยังมีตัวตนไหม
    const author = post.author ? await User.findById(post.author._id) : null;

    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
      await post.save();
      return res.json({ message: "Unliked", likes: post.likes.length });
    }

    post.likes.push(userId);
    await post.save();

    // แจ้งเตือน (เฉพาะถ้า author ยังอยู่ และไม่ใช่ตัวเอง)
    if (author && author._id.toString() !== userId.toString()) {
        const exists = author.notifications.some(
            (n) => n.type === "like" && n.fromUser.toString() === userId.toString() && n.postId?.toString() === postId.toString()
        );

        if (!exists) {
            author.notifications.push({
                type: "like",
                fromUser: me._id,
                message: `${me.name} liked your post`,
                postId,
                read: false,
                createdAt: new Date(),
            });
            await author.save();
        }
    }

    res.json({ message: "Liked", likes: post.likes.length });
  } catch (err) {
    console.error("LIKE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ======================================================
   6) COMMENT
====================================================== */
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) return res.status(400).json({ message: "Comment cannot be empty" });

    const post = await Post.findById(req.params.id).populate("author", "_id name avatar");
    if (!post) return res.status(404).json({ message: "Post not found" });

    const me = await User.findById(req.user._id);
    const author = post.author ? await User.findById(post.author._id) : null;

    post.comments.push({
      author: me.name,
      userId: me._id,
      avatar: me.avatar,
      content,
      date: new Date(),
    });

    await post.save();

    if (author && author._id.toString() !== me._id.toString()) {
        const exists = author.notifications.some(
            (n) => n.type === "comment" && n.fromUser.toString() === me._id.toString() && n.postId?.toString() === post._id.toString() && n.message.includes(content)
        );

        if (!exists) {
            author.notifications.push({
                type: "comment",
                fromUser: me._id,
                message: `${me.name} commented: "${content}"`,
                postId: post._id,
                read: false,
                createdAt: new Date(),
            });
            await author.save();
        }
    }

    // Fix path avatar ใน comment ก่อนส่งกลับ
    const commentsWithFixedPath = post.comments.map(c => ({
        ...c._doc,
        avatar: fixPath(c.avatar)
    }));

    res.json(commentsWithFixedPath);
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

    // เช็คก่อนว่า Post นี้มีอยู่จริงไหม
    const postExists = await Post.findById(pid);
    if (!postExists) return res.status(404).json({ message: "Post not found" });

    const list = user.savedPosts.map((x) => x.toString());
    const saved = !list.includes(pid);

    if (saved) user.savedPosts.push(pid);
    else user.savedPosts = user.savedPosts.filter((x) => x.toString() !== pid);

    await user.save();

    const savedCount = await User.countDocuments({ savedPosts: pid });

    res.json({ 
      saved,
      savedCount 
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   REPORT POST
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
   REPORT COMMENT
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
      commentText: comment.content, 
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

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // ลบรูปภาพจาก Server (ถ้ามี)
    if (post.image && !post.image.startsWith("data:") && !post.image.startsWith("http")) {
       const filePath = path.join(__dirname, "..", post.image);
       if (fs.existsSync(filePath)) {
           fs.unlinkSync(filePath);
       }
    }

    await post.deleteOne();

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE POST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;