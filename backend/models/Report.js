import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  type: { type: String, enum: ["post", "comment"], required: true },

  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  commentId: { type: mongoose.Schema.Types.ObjectId },

  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  reason: { type: String, required: true },

  status: { type: String, default: "pending" }, // pending / reviewed

  createdAt: { type: Date, default: Date.now }

  
});

export default mongoose.model("Report", ReportSchema);
