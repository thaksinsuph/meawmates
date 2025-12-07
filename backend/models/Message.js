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
    image: { type: String, default: "" }, // เก็บ Path สัมพัทธ์ เช่น "/uploads/chat/..."

    /* Pin Message */
    pinnedAt: { type: Date, default: null },

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
  { 
    timestamps: true,
    // 🎯 เปิดใช้งาน Virtual Properties เพื่อให้รวมใน JSON/Object
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
}
);

/* ================================
   🎯 Virtual Property: สร้าง Full Image URL 
================================ */
// Virtual Field นี้จะถูกสร้างขึ้นเมื่อมีการเรียกใช้ .toJSON() หรือ .toObject()
MessageSchema.virtual("fullImageUrl").get(function() {
    // กำหนด Base URL (ดึงจาก process.env.API_BASE_URL ที่ตั้งค่าใน .env)
    const BASE_URL = process.env.API_BASE_URL;

    // ตรวจสอบว่าเป็นข้อความรูปภาพ, มี Path, และมี BASE_URL
    if (this.type === 'image' && this.image && BASE_URL && this.image.startsWith('/uploads')) {
        return BASE_URL + this.image; // รวมเป็น Full Absolute URL
    }
    // คืนค่า Path สัมพัทธ์เดิม หรือ null ถ้าไม่มี
    return this.image || null;
});


/* Index สำคัญสำหรับประสิทธิภาพแชท */
MessageSchema.index({ from: 1, to: 1, createdAt: 1 });
MessageSchema.index({ to: 1, seen: 1 });
MessageSchema.index({ pinnedAt: -1 });

export default mongoose.model("Message", MessageSchema);