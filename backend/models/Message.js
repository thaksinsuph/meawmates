import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    // ผู้ส่ง
    from: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },

    // ผู้รับ
    to: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },

    /* ประเภทข้อความ */
    type: { 
      type: String, 
      enum: ["text", "image", "system"], 
      default: "text" 
    },

    /* เนื้อหาข้อความ */
    text: { type: String, default: "" },
    image: { type: String, default: "" },

    /* Pin Message */
    pinnedAt: { type: Date, default: null }, // ใช้ null/Date เพื่อบ่งชี้สถานะ Pin

    /* ระบบ Seen */
    seen: { type: Boolean, default: false },
    seenAt: { type: Date, default: null },

    /* ฟีเจอร์เสริม */
    deletedFor: [
      { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
      }
    ],

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

  },
  { timestamps: true }
);

/* Index สำคัญสำหรับประสิทธิภาพแชท */
MessageSchema.index({ from: 1, to: 1, createdAt: 1 }); // ดึงประวัติแชทเร็วขึ้น
MessageSchema.index({ to: 1, seen: 1 });             // ดึง unread เร็วขึ้น
MessageSchema.index({ pinnedAt: -1 });               // pin message บนสุดเร็วขึ้น

export default mongoose.model("Message", MessageSchema);