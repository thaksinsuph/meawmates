// backend/routes/pets.routes.js
import express from "express";
import auth from "../auth.js";
import Pet from "../models/Pet.js";

const router = express.Router();

// helper ตรวจ slot
const validateSlot = (slot) => {
  const n = Number(slot);
  if (!Number.isInteger(n) || n < 1 || n > 4) return null;
  return n;
};

// ---------------------------------------------
// 📌 Save / Update Pet ใน slot นั้น
// POST /api/pets/:slot
// ---------------------------------------------
router.post("/:slot", auth, async (req, res) => {
  try {
    const slot = validateSlot(req.params.slot);
    if (!slot) {
      return res.status(400).json({ message: "Slot must be between 1–4" });
    }

    const { name, breed, color, age, image, vaccineImage } = req.body; // ⭐ เพิ่ม vaccineImage

    // หา pet เดิมของ user คนนี้ใน slot นี้
    let pet = await Pet.findOne({ user: req.user._id, slot });

    if (pet) {
      // UPDATE
      pet.name = name;
      pet.breed = breed;
      pet.color = color;
      pet.age = age;
      pet.image = image;
      pet.vaccineImage = vaccineImage;  // ⭐ อัปเดตฟิลด์วัคซีน

      await pet.save();

      return res.json({ message: "Updated", pet });
    }

    // CREATE ใหม่
    pet = await Pet.create({
      user: req.user._id,
      slot,
      name,
      breed,
      color,
      age,
      image,
      vaccineImage, // ⭐ บันทึกฟิลด์วัคซีน
    });

    return res.json({ message: "Created", pet });
  } catch (err) {
    console.error("Save pet error:", err);
    return res.status(500).json({ message: "Cannot save pet" });
  }
});

// ---------------------------------------------
// 📌 Load pet ใน slot นั้นของ user ปัจจุบัน
// GET /api/pets/:slot
// ---------------------------------------------
router.get("/:slot", auth, async (req, res) => {
  try {
    const slot = validateSlot(req.params.slot);
    if (!slot) {
      return res.status(400).json({ message: "Slot must be between 1–4" });
    }

    const pet = await Pet.findOne({ user: req.user._id, slot });

    return res.json(pet || null);
  } catch (err) {
    console.error("Get pet error:", err);
    return res.status(500).json({ message: "Cannot get pet" });
  }
});

// ---------------------------------------------
// 📌 Delete pet ใน slot
// DELETE /api/pets/:slot
// ---------------------------------------------
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

    return res.json({ message: "Deleted", slot });
  } catch (err) {
    console.error("Delete pet error:", err);
    return res.status(500).json({ message: "Cannot delete pet" });
  }
});

export default router;
