// backend/routes/auth.routes.js
import "dotenv/config";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

import passportGoogle from "../auth/google.js";
import passportFacebook from "../auth/facebook.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Debug
console.log("🔍 [AUTH] FRONTEND_URL =", FRONTEND_URL);

/* =====================================================================
   REGISTER
===================================================================== */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing required fields" });

    const exist = await User.findOne({ email });
    if (exist)
      return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashed,
      role: "user",
      avatar: "/images/profile.png",
      bio: "",
    });

    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================================
   LOGIN (Email + Password)
===================================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================================
   GOOGLE LOGIN
===================================================================== */
router.get(
  "/google",
  passportGoogle.authenticate("google", {
    scope: ["email", "profile"],
    session: true,
  })
);

router.get(
  "/google/callback",
  passportGoogle.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login`,
    session: true,
  }),
  async (req, res) => {
    const user = req.user;

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const encoded = encodeURIComponent(token);

    res.redirect(`${FRONTEND_URL}/login?token=${encoded}`);
  }
);

/* =====================================================================
   FACEBOOK LOGIN
===================================================================== */

router.get(
  "/facebook",
  passportFacebook.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passportFacebook.authenticate("facebook", {
    failureRedirect: `${FRONTEND_URL}/login`,
  }),
  async (req, res) => {
    const user = req.user;

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const encoded = encodeURIComponent(token);

    res.redirect(`${FRONTEND_URL}/login?token=${encoded}`);
  }
);

export default router;
