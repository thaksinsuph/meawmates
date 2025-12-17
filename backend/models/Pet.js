// backend/models/Pet.js
import mongoose from "mongoose";

const PetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slot: { type: Number, required: true },
    name: String,
    breed: String,
    color: String,
    age: Number,
    gender: String,
    province: { type: String, default: "" },
    image: { type: String, default: "" }, // ⭐ เพิ่มบรรทัดนี้ เพื่อเก็บ URL รูปแมว
    PetdreegreeImage: { type: String, default: "" },
  },
  { timestamps: true }
);

PetSchema.index({ user: 1, slot: 1 }, { unique: true });
export default mongoose.model("Pet", PetSchema);