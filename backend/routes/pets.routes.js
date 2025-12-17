import express from "express";
import auth from "../auth.js";
import Pet from "../models/Pet.js";
import upload from "../utils/cloudinary.js";

const router = express.Router();

// helper ตรวจ slot
const validateSlot = (slot) => {
  const n = Number(slot);
  if (!Number.isInteger(n) || n < 1 || n > 4) return null;
  return n;
};

// ⭐ Config รับไฟล์ 2 จุด: 'image' (รูปแมว) และ 'PetdreegreeImage' (สมุดวัคซีน)
const petUploads = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'PetdreegreeImage', maxCount: 1 }
]);

/* ============================================================
   📌 GET ALL PETS OF CURRENT USER (No Change)
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
   📌 GET PET BY SLOT (No Change)
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

    const { name, breed, color, age, gender, province } = req.body; 

    let imageUrl = req.body.image; 
    let PetdreegreeUrl = req.body.PetdreegreeImage; 

    // ตรวจสอบไฟล์แมว
    if (req.files && req.files['image']) {
       imageUrl = req.files['image'][0].path; 
    }

    // ตรวจสอบไฟล์ใบเพ็ด
    if (req.files && req.files['PetdreegreeImage']) {
       PetdreegreeUrl = req.files['PetdreegreeImage'][0].path; 
    } else {
       // ⭐ เพิ่มเติม: ถ้าใน body ส่งมาเป็นค่าว่าง (เช่น User กดลบรูปหรือเลือก No) 
       // ให้เซ็ตเป็นค่าว่างเพื่อลบ URL เดิมใน DB
       if (req.body.PetdreegreeImage === "" || req.body.PetdreegreeImage === "null") {
         PetdreegreeUrl = "";
       }
    }

    const updateData = {
      user: req.user._id,
      slot,
      name,
      breed,
      color,
      age: Number(age), // แปลงเป็นตัวเลข
      gender,
      province,
      image: imageUrl,
      PetdreegreeImage: PetdreegreeUrl,
    };

    // ใช้ findOneAndUpdate เพื่อความกระชับ (แทนการ if pet { update } else { create })
    const pet = await Pet.findOneAndUpdate(
      { user: req.user._id, slot },
      updateData,
      { new: true, upsert: true } // upsert: true จะสร้างให้ถ้าหาไม่เจอ
    );

    const isNew = pet.wasNew; // มักใช้ตรวจสอบว่าเป็นการสร้างใหม่หรือไม่
    return res.json({ message: "Saved successfully", pet });

  } catch (err) {
    console.error("Save pet error:", err);
    res.status(500).json({ message: "Cannot save pet", error: err.message });
  }
});

/* ============================================================
   📌 DELETE PET IN SLOT (No Change)
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