// backend/models/CatLike.js
import mongoose from "mongoose";

const CatLikeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // คนที่กด
    myCatSlot: { type: Number, required: true }, // ใช้ slot เพื่อรู้ว่าเป็นแมวตัวไหนของเรา
    targetCat: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true }, // แมวฝั่งตรงข้าม
    liked: { type: Boolean, required: true }, // true = like, false = dislike
  },
  { timestamps: true }
);

export default mongoose.model("CatLike", CatLikeSchema);
