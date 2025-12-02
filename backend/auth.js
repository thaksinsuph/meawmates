import jwt from "jsonwebtoken"
import User from "./models/User.js"

const JWT_SECRET = process.env.JWT_SECRET || "meowmatessecret123"

export default async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || ""
    const token = header.startsWith("Bearer ") ? header.slice(7) : ""

    if (!token) {
      return res.status(401).json({ message: "No token" })
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    let avatar = user.avatar || null

    // ⭐ ถ้า avatar เป็นไฟล์ path เช่น uploads/avatar.png → normalize ให้เข้ารูปแบบ URL
    if (avatar && !avatar.startsWith("data:")) {
      avatar = "/" + avatar.replace(/\\/g, "/").replace(/^\//, "")
    }

    req.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: avatar,   // ⭐ ใช้ตามจริง (base64 หรือ path)
    }

    next()
  } catch (err) {
    console.error("Auth error:", err.message)
    return res.status(401).json({ message: "Invalid token" })
  }
}
