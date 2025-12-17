import mongoose from "mongoose";

const CatLikeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // คนที่กด
    myCatSlot: { type: Number, required: true }, // ใช้ slot เพื่อรู้ว่าเป็นแมวตัวไหนของเรา
    targetCat: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true }, // แมวฝั่งตรงข้าม
    liked: { type: Boolean, required: true }, // true = like, false = dislike
    
    // ⭐ NEW: เพิ่มฟิลด์สำหรับเก็บคะแนนความเข้ากันได้
    matchScore: { 
      type: Number, 
      default: 0 
    }, 
  },
  { timestamps: true }
);

export default mongoose.model("CatLike", CatLikeSchema);