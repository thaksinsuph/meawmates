import mongoose from "mongoose";

const MatchCatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  breed: String,
  color: String,
  age: Number,
  image: String,
  personality: String,
  slot: Number,
  // ⭐ เพิ่มบรรทัดนี้
  matchScore: { type: Number, default: 0 }, 
  province: String,
  gender: String,
  PetdreegreeImage: String
});

export default mongoose.model("MatchCat", MatchCatSchema);