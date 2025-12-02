import mongoose from "mongoose";

/* ===================================================
   COMMENT SCHEMA
=================================================== */
const commentSchema = new mongoose.Schema(
  {
    author: String,  // ชื่อผู้คอมเมนต์
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    avatar: String,
    content: String,

    // Report system
    reported: { type: Boolean, default: false },
    reportReason: String,
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reportDate: Date,

    date: { type: Date, default: Date.now }
  },
  { timestamps: false }   // ให้ mongoose สร้าง _id อัตโนมัติ
);

/* ===================================================
   POST SCHEMA
=================================================== */
const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: String,
    image: String,

    // ❗ ต้องใช้ ObjectId
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    comments: [commentSchema]
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
