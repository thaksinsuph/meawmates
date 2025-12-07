import mongoose from "mongoose";

/* ===================================================
   🐱 PET SCHEMA (แมวของผู้ใช้)
=================================================== */
const petSchema = new mongoose.Schema({
  name: String,
  age: Number,
  gender: String,
  breed: String,
  color: String,
  personality: String,
  image: String, // base64 หรือไฟล์ใน /uploads
});

/* 🔔 NOTIFICATION SUB-SCHEMA */
const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["follow", "like", "comment"], required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },

    message: String,

    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ===================================================
   🧑‍💻 USER SCHEMA (ผู้ใช้)
=================================================== */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    // ⭐ แก้ตรงนี้ ไม่ required แล้ว
    password: { type: String, required: false, default: null },

    avatar: { type: String, default: "/images/profile.png" },
    bio: { type: String, default: "" },

    role: { type: String, default: "user" },

    banned: { type: Boolean, default: false },

    pets: {
      type: [petSchema],
      default: [],
    },

    savedPosts: {
      // ⭐⭐ แก้ไข: เปลี่ยนจาก String เป็น ObjectId ที่อ้างอิงถึง Post
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }], 
      default: [],
    },

    followers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],
    following: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],

    notifications: {
      type: [notificationSchema],
      default: [],
    },
  },
  { timestamps: true }
);


export default mongoose.model("User", userSchema);