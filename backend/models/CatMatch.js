import mongoose from "mongoose";

const CatMatchSchema = new mongoose.Schema({
  cat1: { type: mongoose.Schema.Types.ObjectId, ref: "MatchCat" },
  cat2: { type: mongoose.Schema.Types.ObjectId, ref: "MatchCat" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("CatMatch", CatMatchSchema);
