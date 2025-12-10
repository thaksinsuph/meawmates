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
⭐ MODIFIED ENDPOINT: ดึงรายการสัตว์เลี้ยงตามเงื่อนไข Petdreegree (List View)
GET /api/matching/filtered-cats?breed=...&province=...
====================================================== */
router.get('/filtered-cats', auth, async (req, res) => {
    try {
        const userId = req.user._id; 
        // 💡 MODIFIED: รับเงื่อนไขการกรองจาก Frontend (req.query) รวมถึง 'province'
        const { breed, color, age, gender, province } = req.query; // ✅ FIX: เพิ่ม province

        // 1. หาแมวที่เราเคยปัดไปแล้ว (เพื่อให้ไม่โชว์ซ้ำ)
        const swiped = await CatLike.find({ user: userId }).distinct("targetCat");

        // 2. สร้าง Query Object พื้นฐาน
        const filter = {
            user: { $ne: userId },        // ไม่เอาแมวที่เป็นของ User ที่กำลังค้นหา
            _id: { $nin: swiped },        // ไม่เอาแมวที่เคยปัดไปแล้ว
            name: { $exists: true, $ne: "" }, // ต้องมีชื่อ
            image: { $exists: true, $ne: "" }, // ต้องมีรูป
        };
        
        // 3. เพิ่มเงื่อนไขการกรองตาม Petdreegree Criteria
        
        // กรองตามสายพันธุ์ (Breed)
        if (breed && breed !== 'Any') {
            filter.breed = breed;
        }

        // กรองตามสี (Color)
        if (color && color !== 'Any') {
            filter.color = color;
        }

        // กรองตามเพศ (Gender)
        if (gender && gender !== 'Any') {
            filter.gender = gender;
        }

        // ⭐ NEW: กรองตามจังหวัด (Province)
        if (province && province !== 'Any') {
            filter.province = province;
        }

        // กรองตามช่วงอายุ (Age Range)
        if (age && age !== 'Any') {
            // age format: '0-1', '1-3', '7+'
            const [minStr, maxStr] = age.split('-');
            const min = parseInt(minStr);
            
            if (age.includes('+')) { // สำหรับ '7+'
                filter.age = { $gte: min }; 
            } else if (min !== undefined && maxStr !== undefined) { // สำหรับ '0-1', '1-3'
                const max = parseInt(maxStr);
                filter.age = { $gte: min, $lte: max };
            }
        }
        
        // 4. ดึงข้อมูลสัตว์เลี้ยงที่ตรงตามเงื่อนไข
        // 💡 เราจะใส่ province ใน select list ด้วย
        const targets = await Pet.find(filter)
            .select('name breed color age gender province image user') // ✅ เพิ่ม province
            .limit(50); 
        
        res.json(targets);
        
    } catch (err) {
        console.error('Error fetching filtered cats:', err.message);
        res.status(500).json({ message: "Cannot load filtered cats" });
    }
});


/* ======================================================
📌 1) Swipe (Like / Dislike) - MODIFIED: บันทึก Province ใน MatchCat
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

        // ⭐ ดึง myPet และ targetPet เพื่อเข้าถึง Province
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
                    // ⭐ ส่ง ownerId กลับไปเพื่อให้ Frontend เปิด Chat ได้
                    ownerId: targetOwner, 
                });
            }
        }

        // ⭐ MODIFIED: เพิ่ม province ใน MatchCat.create
        const myMatchCat = mySnapshot
            ? mySnapshot
            : await MatchCat.create({
                  user: me,
                  name: myPet.name,
                  breed: myPet.breed,
                  color: myPet.color,
                  age: myPet.age,
                  gender: myPet.gender,
                  province: myPet.province, // ✅ เพิ่ม province
                  image: myPet.image,
                  slot: myPet.slot,
              });

        // ⭐ MODIFIED: เพิ่ม province ใน MatchCat.create
        const targetMatchCat = targetSnapshot
            ? targetSnapshot
            : await MatchCat.create({
                  user: targetOwner,
                  name: targetPet.name,
                  breed: targetPet.breed,
                  color: targetPet.color,
                  age: targetPet.age,
                  gender: targetPet.gender,
                  province: targetPet.province, // ✅ เพิ่ม province
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
            // ⭐ ส่ง ownerId กลับไปเพื่อให้ Frontend เปิด Chat ได้
            ownerId: targetOwner, 
        });
    } catch (err) {
        console.error("Swipe error:", err);
        res.status(500).json({ message: "Error processing swipe" });
    }
});

/* ======================================================
📌 2) ประวัติ Like (โค้ดเดิม)
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
📌 3) รายชื่อคู่ที่ Match แล้ว (FINAL FIX: ใช้ Pet Model เสริมข้อมูล Gender/Province)
====================================================== */
router.get("/matches", auth, async (req, res) => {
    try {
        const me = req.user._id;

        // 1. Populate CatMatch (ซึ่งมีข้อมูลไม่สมบูรณ์สำหรับ Match เก่า)
        const matches = await CatMatch.find()
            .populate("cat1")
            .populate("cat2");

        const myMatches = matches.filter(
            (m) =>
                m.cat1.user.toString() === me.toString() ||
                m.cat2.user.toString() === me.toString()
        );

        const grouped = {};

        // 2. Map ผ่าน Match ต่างๆ แล้ว Populate Pet Document มาเสริม
        const matchPromises = myMatches.map(async (m) => {
             const iAmCat1 = m.cat1.user.toString() === me.toString();
             const otherMatchCat = iAmCat1 ? m.cat2 : m.cat1;
             const ownerId = otherMatchCat.user.toString();

             // ⭐ NEW STEP: ดึง Pet Document (จาก Pet Model) ที่สมบูรณ์มาใช้
             // ใช้ Pet.findOne โดย Match ด้วย ownerId และชื่อ (หรือ Slot)
             const fullOtherPet = await Pet.findOne({ 
                 user: ownerId, 
                 name: otherMatchCat.name // Match ด้วยชื่อ
             }).select('gender province'); 
             
             // 3. จัดกลุ่ม (Grouped logic)
             if (!grouped[ownerId]) {
                grouped[ownerId] = {
                    user: ownerId,      
                    cats: [],
                    lastMatchedAt: m.createdAt,
                    myCatSlot: iAmCat1 ? m.cat1.slot : m.cat2.slot,
                };
             }

             // ใช้ข้อมูลจาก Pet Document ถ้าข้อมูลใน MatchCat ไม่สมบูรณ์
             const finalGender = otherMatchCat.gender || fullOtherPet?.gender || '—';
             const finalProvince = otherMatchCat.province || fullOtherPet?.province || '—';

             // 4. Push ข้อมูลที่ถูกแก้ไขแล้ว
             grouped[ownerId].cats.push({
                name: otherMatchCat.name,
                image: otherMatchCat.image,
                breed: otherMatchCat.breed,
                color: otherMatchCat.color,
                age: otherMatchCat.age,
                gender: finalGender,         // ⭐ ใช้ finalGender
                province: finalProvince,     // ⭐ ใช้ finalProvince
                _id: otherMatchCat._id,      // เพิ่ม _id เพื่อให้ Frontend แยกแยะได้
            });

            // update last matched time
            if (m.createdAt > grouped[ownerId].lastMatchedAt) {
                 grouped[ownerId].lastMatchedAt = m.createdAt;
            }

        });
        
        await Promise.all(matchPromises); // รอให้การดึง Pet Document ทั้งหมดเสร็จสิ้น

        // ⭐⭐ NEW: Map เพื่อหา Last Message และ Unread Status (UNCHANGED)
        const groupsForLastMessage = Object.values(grouped); 
        
        const resultWithLastMessage = await Promise.all(
            groupsForLastMessage.map(async (group) => {
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
        console.error("Load matches error:", err);
        res.status(500).json({ message: "Cannot load matches" });
    }
});


export default router;