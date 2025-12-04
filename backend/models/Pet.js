// backend/models/Pet.js
import mongoose from "mongoose";

const PetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slot: { type: Number, required: true }, // 1–4
    name: String,
    breed: String,
    color: String,
    age: Number,

    image: String,         // base64 รูปแมว
    vaccineImage: String,  // ⭐ รูปสมุดวัคซีน (base64) — ที่เพิ่มใหม่
  },
  { timestamps: true }
);

// ไม่ให้ user คนเดียวมีแมวซ้ำ slot เดียวกัน
PetSchema.index({ user: 1, slot: 1 }, { unique: true });

export default mongoose.model("Pet", PetSchema);
