// backend/routes/pets.routes.js
import express from "express";
import auth from "../auth.js";
import Pet from "../models/Pet.js";
import upload from "../utils/cloudinary.js"; // 👈 1. Import ตัวจัดการ upload

const router = express.Router();

// helper ตรวจ slot
const validateSlot = (slot) => {
  const n = Number(slot);
  if (!Number.isInteger(n) || n < 1 || n > 4) return null;
  return n;
};

// ⭐ Config รับไฟล์ 2 จุด: 'image' (รูปแมว) และ 'vaccineImage' (สมุดวัคซีน)
const petUploads = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'vaccineImage', maxCount: 1 }
]);

/* ============================================================
   📌 GET ALL PETS OF CURRENT USER
   GET /api/pets/me
============================================================ */
router.get("/me", auth, async (req, res) => {
  try {
    const pets = await Pet.find({ user: req.user._id }).sort({ slot: 1 });
    res.json(pets);
  } catch (err) {
    console.error("Get my pets error:", err);
    res.status(500).json({ message: "Cannot load pets" });
  }
});

/* ============================================================
   📌 GET PET BY SLOT
   GET /api/pets/:slot
============================================================ */
router.get("/:slot", auth, async (req, res) => {
  try {
    const slot = validateSlot(req.params.slot);
    if (!slot) {
      return res.status(400).json({ message: "Slot must be between 1–4" });
    }

    const pet = await Pet.findOne({ user: req.user._id, slot });

    res.json(pet || null);
  } catch (err) {
    console.error("Get pet error:", err);
    res.status(500).json({ message: "Cannot get pet" });
  }
});

/* ============================================================
   📌 CREATE OR UPDATE PET IN SLOT (Support Cloudinary)
   POST /api/pets/:slot
============================================================ */
// 👇 ใส่ middleware 'petUploads' เพื่อดักจับไฟล์ก่อนเข้าทำงาน
router.post("/:slot", auth, petUploads, async (req, res) => {
  try {
    const slot = validateSlot(req.params.slot);
    if (!slot) {
      return res.status(400).json({ message: "Slot must be between 1–4" });
    }

    // ข้อมูล Text จะอยู่ใน req.body
    // ⭐ เพิ่ม gender เข้ามา
    const { name, breed, color, age, gender } = req.body; 

    // เตรียมตัวแปรสำหรับ URL รูปภาพ
    let imageUrl = req.body.image; // ค่าเดิม (ถ้ามี)
    let vaccineUrl = req.body.vaccineImage; // ค่าเดิม (ถ้ามี)

    // ⭐ ตรวจสอบว่ามีการอัปโหลดไฟล์ "image" ใหม่มาหรือไม่?
    // req.files จะมีโครงสร้างเป็น Object เก็บ array ของไฟล์
    if (req.files && req.files['image']) {
       imageUrl = req.files['image'][0].path; // ใช้ URL ใหม่จาก Cloudinary
    }

    // ⭐ ตรวจสอบว่ามีการอัปโหลดไฟล์ "vaccineImage" ใหม่มาหรือไม่?
    if (req.files && req.files['vaccineImage']) {
       vaccineUrl = req.files['vaccineImage'][0].path; // ใช้ URL ใหม่จาก Cloudinary
    }

    // ค้นหา Pet เดิมใน Slot นี้
    let pet = await Pet.findOne({ user: req.user._id, slot });

    if (pet) {
      // === UPDATE ===
      pet.name = name;
      pet.breed = breed;
      pet.color = color;
      pet.age = age;
      // ⭐ อัปเดต gender
      pet.gender = gender; 
      pet.image = imageUrl; // อัปเดต URL (ใหม่หรือเก่า)
      pet.vaccineImage = vaccineUrl; // อัปเดต URL (ใหม่หรือเก่า)
      
      await pet.save();
      return res.json({ message: "Updated successfully", pet });
    }

    // === CREATE ===
    // ถ้าสร้างใหม่ ต้องมีรูป image เสมอ (ตาม Logic ฝั่ง Frontend ที่เรากันไว้)
    pet = await Pet.create({
      user: req.user._id,
      slot,
      name,
      breed,
      color,
      age,
      // ⭐ สร้าง gender
      gender, 
      image: imageUrl,
      vaccineImage: vaccineUrl,
    });

    return res.json({ message: "Created successfully", pet });

  } catch (err) {
    console.error("Save pet error:", err);
    res.status(500).json({ message: "Cannot save pet", error: err.message });
  }
});

/* ============================================================
   📌 DELETE PET IN SLOT
   DELETE /api/pets/:slot
============================================================ */
router.delete("/:slot", auth, async (req, res) => {
  try {
    const slot = validateSlot(req.params.slot);
    if (!slot) {
      return res.status(400).json({ message: "Slot must be between 1–4" });
    }

    const pet = await Pet.findOneAndDelete({ user: req.user._id, slot });

    if (!pet) {
      return res.status(404).json({ message: "Pet not found in this slot" });
    }

    res.json({ message: "Deleted", slot });
  } catch (err) {
    console.error("Delete pet error:", err);
    res.status(500).json({ message: "Cannot delete pet" });
  }
});

export default router;