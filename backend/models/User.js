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

    password: { type: String, required: true },

    avatar: { type: String, default: null },

    /* ⭐ BIO */
    bio: { type: String, default: "" },

    /* ⭐ ROLE */
    role: { type: String, default: "user" },

    /* ⭐ BAN STATUS */
    banned: { type: Boolean, default: false },

    /* ⭐ PETS */
    pets: {
      type: [petSchema],
      default: [],
    },

    /* ⭐ SAVED POSTS */
    savedPosts: {
      type: [String],
      default: [],
    },

    /* ⭐ FOLLOW SYSTEM */
    followers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],
    following: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],

    /* ⭐ NOTIFICATIONS (Embedded in user) */
    notifications: {
      type: [notificationSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
