import express from "express";
import auth from "../auth.js";
import CatLike from "../models/CatLike.js";
import CatMatch from "../models/CatMatch.js";
import MatchCat from "../models/MatchCat.js";
import Pet from "../models/Pet.js";
import Message from "../models/Message.js"; 

const router = express.Router();

/* ======================================================
📌 0) โหลดแมวที่ “ยังไม่เคย Swipe มาก่อน” (โค้ดเดิม)
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
⭐ MODIFIED ENDPOINT: ดึงรายการสัตว์เลี้ยงตามเงื่อนไข Petdreegree
GET /api/matching/filtered-cats?breed=...&hasPedigree=...
====================================================== */
router.get('/filtered-cats', auth, async (req, res) => {
    try {
        const userId = req.user._id; 
        // ⭐ Added hasPedigree to query destructuring
        const { breed, color, age, gender, province, hasPedigree } = req.query; 

        const swiped = await CatLike.find({ user: userId }).distinct("targetCat");

        const filter = {
            user: { $ne: userId }, 
            _id: { $nin: swiped },
            name: { $exists: true, $ne: "" }, 
            image: { $exists: true, $ne: "" }, 
        };
        
        if (breed && breed !== 'Any') { filter.breed = breed; }
        if (color && color !== 'Any') { filter.color = color; }
        if (gender && gender !== 'Any') { filter.gender = gender; }
        if (province && province !== 'Any') { filter.province = province; }

        // ⭐ NEW LOGIC: Petdreegree (Pedigree) Filter
        if (hasPedigree === "Yes") {
            // Find cats that HAVE a pedigree image (not empty, not null)
            filter.PetdreegreeImage = { $ne: "", $exists: true, $not: /^\s*$/ };
        } else if (hasPedigree === "No") {
            // Find cats that DO NOT have a pedigree image
            filter.$or = [
                { PetdreegreeImage: "" },
                { PetdreegreeImage: null },
                { PetdreegreeImage: { $exists: false } }
            ];
        }

        if (age && age !== 'Any') {
            const [minStr, maxStr] = age.split('-');
            const min = parseInt(minStr);
            
            if (age.includes('+')) {
                filter.age = { $gte: min }; 
            } else if (min !== undefined && maxStr !== undefined) {
                const max = parseInt(maxStr);
                filter.age = { $gte: min, $lte: max };
            }
        }
        
        const targets = await Pet.find(filter)
            .select('name breed color age gender province image user PetdreegreeImage')
            .limit(50); 
        
        res.json(targets);
        
    } catch (err) {
        console.error('Error fetching filtered cats:', err.message);
        res.status(500).json({ message: "Cannot load filtered cats" });
    }
});


/* ======================================================
📌 1) Swipe (Like / Dislike) - MODIFIED: รับคะแนน Match Score
====================================================== */
router.post("/swipe", auth, async (req, res) => {
    try {
        // ⭐ เพิ่ม matchScore ในการรับข้อมูลจาก body
        const { myCatSlot, targetCatId, liked, matchScore } = req.body;
        const me = req.user._id;

        // บันทึกการ Swipe พร้อมคะแนน
        await CatLike.create({
            user: me,
            myCatSlot,
            targetCat: targetCatId,
            liked,
            matchScore: matchScore || 0, // ⭐ บันทึกคะแนนลงใน Database
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
          🎉 MATCH!! 
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
                    ownerId: targetOwner, 
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
                  province: myPet.province,
                  PetdreegreeImage: myPet.PetdreegreeImage,
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
                  province: targetPet.province,
                  PetdreegreeImage: targetPet.PetdreegreeImage,
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
            ownerId: targetOwner, 
        });
    } catch (err) {
        console.error("Swipe error:", err);
        res.status(500).json({ message: "Error processing swipe" });
    }
});

/* ======================================================
📌 2) ประวัติ Like - MODIFIED: ส่งค่า matchScore กลับไป
====================================================== */
router.get("/history", auth, async (req, res) => {
    try {
        const history = await CatLike.find({ user: req.user._id })
            .populate({
                path: "targetCat",
                // ⭐ ตรวจสอบว่าดึง PetdreegreeImage และ province มาด้วย
                select: "name image breed color age gender province PetdreegreeImage" 
            })
            .sort({ createdAt: -1 });

        // ค่า matchScore จะติดไปกับ object h อยู่แล้วเพราะอยู่ใน Schema CatLike
        res.json(history);
    } catch (err) {
        console.error("Load history error:", err);
        res.status(500).json({ message: "Cannot load history" });
    }
});

/* ======================================================
📌 3) รายชื่อคู่ที่ Match แล้ว
====================================================== */
router.get("/matches", auth, async (req, res) => {
    try {
        const me = req.user._id;

        const matches = await CatMatch.find()
            .populate("cat1")
            .populate("cat2");

        const myMatches = matches.filter(
            (m) =>
                m.cat1.user.toString() === me.toString() ||
                m.cat2.user.toString() === me.toString()
        );

        const grouped = {};

        const matchPromises = myMatches.map(async (m) => {
             const iAmCat1 = m.cat1.user.toString() === me.toString();
             const otherMatchCat = iAmCat1 ? m.cat2 : m.cat1;
             const ownerId = otherMatchCat.user.toString();

             // Get full data from Pet model if snapshot is missing details
             const fullOtherPet = await Pet.findOne({ 
                 user: ownerId, 
                 name: otherMatchCat.name 
             }).select('gender province PetdreegreeImage'); 
             
             if (!grouped[ownerId]) {
                grouped[ownerId] = {
                    user: ownerId,      
                    cats: [],
                    lastMatchedAt: m.createdAt,
                    myCatSlot: iAmCat1 ? m.cat1.slot : m.cat2.slot,
                };
             }

             const finalGender = otherMatchCat.gender || fullOtherPet?.gender || '—';
             const finalProvince = otherMatchCat.province || fullOtherPet?.province || '—';
             const hasPedigree = (otherMatchCat.PetdreegreeImage || fullOtherPet?.PetdreegreeImage) ? "Yes" : "No";

             grouped[ownerId].cats.push({
                name: otherMatchCat.name,
                image: otherMatchCat.image,
                breed: otherMatchCat.breed,
                color: otherMatchCat.color,
                age: otherMatchCat.age,
                gender: finalGender,
                province: finalProvince,
                hasPedigree: hasPedigree, // Added for frontend card display
                _id: otherMatchCat._id,      
            });

            if (m.createdAt > grouped[ownerId].lastMatchedAt) {
                 grouped[ownerId].lastMatchedAt = m.createdAt;
            }
        });
        
        await Promise.all(matchPromises); 

        const groupsForLastMessage = Object.values(grouped); 
        
        const resultWithLastMessage = await Promise.all(
            groupsForLastMessage.map(async (group) => {
                const ownerId = group.user; 
                
                const unseenCount = await Message.countDocuments({
                    to: req.user._id,
                    from: ownerId,
                    seen: false,
                });
                
                const lastMessage = await Message.findOne({
                    $or: [
                        { from: req.user._id, to: ownerId },
                        { from: ownerId, to: req.user._id },
                    ]
                })
                .sort({ createdAt: -1 })
                .select('text image from to seen createdAt');
                
                let hasNewMessage = unseenCount > 0;
                let lastMessageContent = "Chat now";
                let lastActivity = group.lastMatchedAt; 

                if (lastMessage) {
                    lastMessageContent = lastMessage.text || "[Image]";
                    lastActivity = lastMessage.createdAt;
                }

                return {
                    ...group,
                    lastMessage: lastMessage,
                    lastMessageContent: lastMessageContent, 
                    hasNewMessage: hasNewMessage, 
                    lastActivity: lastActivity, 
                    unseenCount: unseenCount,
                };
            })
        );

        resultWithLastMessage.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

        res.json(resultWithLastMessage); 

    } catch (err) {
        console.error("Load matches error:", err);
        res.status(500).json({ message: "Cannot load matches" });
    }
});

export default router;