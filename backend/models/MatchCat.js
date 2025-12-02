import mongoose from "mongoose";

const MatchCatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  name: String,
  breed: String,
  color: String,
  age: Number,
  image: String,
  personality: String,

  slot: Number, // เก็บว่ามาจากช่องไหน (1–4)
});

export default mongoose.model("MatchCat", MatchCatSchema);
