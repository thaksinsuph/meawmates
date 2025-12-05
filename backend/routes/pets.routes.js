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
   📌 CREATE OR UPDATE PET IN SLOT
   POST /api/pets/:slot
============================================================ */
router.post("/:slot", auth, async (req, res) => {
  try {
    const slot = validateSlot(req.params.slot);
    if (!slot) {
      return res.status(400).json({ message: "Slot must be between 1–4" });
    }

    const { name, breed, color, age, image, vaccineImage } = req.body;

    let pet = await Pet.findOne({ user: req.user._id, slot });

    if (pet) {
      // UPDATE
      pet.name = name;
      pet.breed = breed;
      pet.color = color;
      pet.age = age;
      pet.image = image;
      pet.vaccineImage = vaccineImage;
      await pet.save();

      return res.json({ message: "Updated", pet });
    }

    // CREATE
    pet = await Pet.create({
      user: req.user._id,
      slot,
      name,
      breed,
      color,
      age,
      image,
      vaccineImage,
    });

    return res.json({ message: "Created", pet });
  } catch (err) {
    console.error("Save pet error:", err);
    res.status(500).json({ message: "Cannot save pet" });
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
