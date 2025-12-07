import express from "express";
import auth from "../auth.js";
import CatLike from "../models/CatLike.js";
import CatMatch from "../models/CatMatch.js";
import MatchCat from "../models/MatchCat.js";
import Pet from "../models/Pet.js";
import Message from "../models/Message.js"; // ⭐ ต้อง Import Message Model

const router = express.Router();

/* ======================================================
📌 0) โหลดแมวที่ “ยังไม่เคย Swipe มาก่อน”
====================================================== */
router.get("/cats", auth, async (req, res) => {
  try {
    const me = req.user._id;

    const swiped = await CatLike.find({ user: me }).distinct("targetCat");

    const cats = await Pet.find({
      user: { $ne: me },
      _id: { $nin: swiped },
      name: { $exists: true, $ne: "" },
      image: { $exists: true, $ne: "" },
    }).populate("user", "_id name");

    res.json(cats);
  } catch (err) {
    console.error("Load target cats error:", err);
    res.status(500).json({ message: "Cannot load cats" });
  }
});

/* ======================================================
📌 1) Swipe (Like / Dislike)
====================================================== */
router.post("/swipe", auth, async (req, res) => {
  try {
    const { myCatSlot, targetCatId, liked } = req.body;
    const me = req.user._id;

    await CatLike.create({
      user: me,
      myCatSlot,
      targetCat: targetCatId,
      liked,
    });

    if (!liked) return res.json({ match: false });

    const myPet = await Pet.findOne({ user: me, slot: myCatSlot });
    if (!myPet) return res.json({ match: false });

    const targetPet = await Pet.findById(targetCatId);
    if (!targetPet) return res.status(404).json({ message: "Pet not found" });

    const targetOwner = targetPet.user;

    const theyLikedMe = await CatLike.findOne({
      user: targetOwner,
      targetCat: myPet._id,
      liked: true,
    });

    if (!theyLikedMe) return res.json({ match: false });

    /* ======================================================
       🎉 MATCH!! → กันสร้างซ้ำแบบถูกต้อง
    ====================================================== */

    const mySnapshot = await MatchCat.findOne({
      user: me,
      name: myPet.name,
      slot: myPet.slot,
    });

    const targetSnapshot = await MatchCat.findOne({
      user: targetOwner,
      name: targetPet.name,
      slot: targetPet.slot,
    });

    // มี match เดิมแล้ว
    if (mySnapshot && targetSnapshot) {
      const existing = await CatMatch.findOne({
        $or: [
          { cat1: mySnapshot._id, cat2: targetSnapshot._id },
          { cat1: targetSnapshot._id, cat2: mySnapshot._id },
        ],
      });

      if (existing) {
        return res.json({
          match: true,
          matchedCat: targetSnapshot,
        });
      }
    }

    const myMatchCat = mySnapshot
      ? mySnapshot
      : await MatchCat.create({
          user: me,
          name: myPet.name,
          breed: myPet.breed,
          color: myPet.color,
          age: myPet.age,
          gender: myPet.gender,
          image: myPet.image,
          slot: myPet.slot,
        });

    const targetMatchCat = targetSnapshot
      ? targetSnapshot
      : await MatchCat.create({
          user: targetOwner,
          name: targetPet.name,
          breed: targetPet.breed,
          color: targetPet.color,
          age: targetPet.age,
          gender: targetPet.gender,
          image: targetPet.image,
          slot: targetPet.slot,
        });

    await CatMatch.create({
      cat1: myMatchCat._id,
      cat2: targetMatchCat._id,
    });

    return res.json({
      match: true,
      matchedCat: targetMatchCat,
    });
  } catch (err) {
    console.error("Swipe error:", err);
    res.status(500).json({ message: "Error processing swipe" });
  }
});

/* ======================================================
📌 2) ประวัติ Like
====================================================== */
router.get("/history", auth, async (req, res) => {
  try {
    const history = await CatLike.find({ user: req.user._id })
      .populate("targetCat")
      .sort({ createdAt: -1 });

    res.json(history);
  } catch {
    res.status(500).json({ message: "Cannot load history" });
  }
});

/* ======================================================
📌 3) รายชื่อคู่ที่ Match แล้ว — ห้องเดียวต่อ Owner (แก้ไขเพื่อ Chat Noti)
====================================================== */
router.get("/matches", auth, async (req, res) => {
  try {
    const me = req.user._id;

    const matches = await CatMatch.find()
      .populate("cat1")
      .populate("cat2");

    const myMatches = matches.filter(
      (m) =>
        m.cat1.user.toString() === me ||
        m.cat2.user.toString() === me
    );

    const grouped = {};

    myMatches.forEach((m) => {
      const iAmCat1 = m.cat1.user.toString() === me;
      const other = iAmCat1 ? m.cat2 : m.cat1;
      const ownerId = other.user.toString();

      if (!grouped[ownerId]) {
        grouped[ownerId] = {
          user: ownerId,     // ⭐ สำคัญที่สุดสำหรับ Messages.jsx
          cats: [],
          lastMatchedAt: m.createdAt,
        };
      }

      grouped[ownerId].cats.push({
        name: other.name,
        image: other.image,
        breed: other.breed,
        age: other.age,
        gender: other.gender,
      });

      // update last matched time
      if (m.createdAt > grouped[ownerId].lastMatchedAt) {
        grouped[ownerId].lastMatchedAt = m.createdAt;
      }
    });
    
    // ⭐⭐ NEW: Map เพื่อหา Last Message และ Unread Status
    const resultWithLastMessage = await Promise.all(
        Object.values(grouped).map(async (group) => {
            const ownerId = group.user; 
            
            const lastMessage = await Message.findOne({
                $or: [
                    { from: req.user._id, to: ownerId },
                    { from: ownerId, to: req.user._id },
                ]
            })
            .sort({ createdAt: -1 })
            .select('text image from to seen createdAt');
            
            let hasNewMessage = false;
            let lastMessageContent = "Chat now";
            let lastActivity = group.lastMatchedAt; // ใช้ Match Time เป็นค่าเริ่มต้น

            if (lastMessage) {
                const isFromOtherUser = lastMessage.from.toString() === ownerId;
                const isUnseen = lastMessage.seen === false;
                
                hasNewMessage = isFromOtherUser && isUnseen;
                lastMessageContent = lastMessage.text || "[Image]";
                lastActivity = lastMessage.createdAt; // อัปเดต Activity Time
            }

            return {
                ...group,
                lastMessage: lastMessage,
                lastMessageContent: lastMessageContent, 
                hasNewMessage: hasNewMessage, // ⭐ Frontend ใช้ field นี้
                lastActivity: lastActivity, // ⭐ Frontend ใช้ field นี้ในการเรียง
            };
        })
    );

    // ⭐ เรียงลำดับแชทตาม Activity ล่าสุด
    resultWithLastMessage.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    res.json(resultWithLastMessage); 

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cannot load matches" });
  }
});
export default router;