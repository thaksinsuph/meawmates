import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["like", "comment"], required: true },
    text: { type: String, required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },   // ⭐ สำคัญ!
    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", NotificationSchema);
