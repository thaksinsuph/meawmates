import { useState, useEffect } from "react";
import { BREEDS, CAT_COLORS } from "../petData";
import api from "../api";

export default function ManagePet() {
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [preview, setPreview] = useState(null);
  const [allPets, setAllPets] = useState([{}, {}, {}, {}]); // UI cards

  const [form, setForm] = useState({
    name: "",
    breed: "",
    color: "",
    age: "",
    image: null,
  });

  const [popup, setPopup] = useState({
    open: false,
    title: "",
    img: "",
    desc: "",
  });

  // ----------------------------
  // 📌 โหลดแมว 4 ช่องทั้งหมด
  // ----------------------------
  const loadAllPets = async () => {
    const newPets = [];
    for (let i = 1; i <= 4; i++) {
      try {
        const res = await api.get(`/api/pets/${i}`);
        newPets.push(res.data || {});
      } catch {
        newPets.push({});
      }
    }
    setAllPets(newPets);
  };

  // ----------------------------
  // 📌 โหลดแมวเฉพาะช่อง
  // ----------------------------
  const loadPet = async (slot) => {
    try {
      const res = await api.get(`/api/pets/${slot}`);
      const pet = res.data;

      if (pet) {
        setForm({
          name: pet.name || "",
          breed: pet.breed || "",
          color: pet.color || "",
          age: pet.age || "",
          image: pet.image || null,
        });
        setPreview(pet.image || null);
      } else {
        resetForm();
      }
    } catch {
      resetForm();
    }
  };

  // รีเซ็ตฟอร์ม
  const resetForm = () => {
    setForm({
      name: "",
      breed: "",
      color: "",
      age: "",
      image: null,
    });
    setPreview(null);
  };

  useEffect(() => {
    loadPet(selectedSlot);
    loadAllPets();
  }, [selectedSlot]);

  useEffect(() => {
    loadAllPets();
  }, []);

  // ----------------------------
  // 📌 อัพโหลดรูป
  // ----------------------------
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setForm({ ...form, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // ----------------------------
  // 📌 Popup info
  // ----------------------------
  const openPopup = (title, data) => {
    setPopup({
      open: true,
      title,
      desc: data.desc,
      img: data.img,
    });
  };

  // ----------------------------
  // 📌 บันทึกแมว
  // ----------------------------
  const savePet = async () => {
    if (!form.name || !form.breed || !form.color || !form.age || !form.image) {
      return alert("กรุณากรอกข้อมูลให้ครบ");
    }

    try {
      await api.post(`/api/pets/${selectedSlot}`, form);
      alert(`Record cat information in the field ${selectedSlot} succeed`);
      loadAllPets();
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving the data.");
    }
  };

  // ----------------------------
  // ❌ ลบแมวในช่อง
  // ----------------------------
  const deletePet = async (slot) => {
    if (!confirm(`Want to delete channel information ${slot} Right?`)) return;

    try {
      await api.delete(`/api/pets/${slot}`);
      if (slot === selectedSlot) resetForm();
      loadAllPets();
      alert("Successfully deleted");
    } catch {
      alert("Failed to delete");
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-12 px-4 gap-12">
      
      {/* Title */}
      <h1 className="text-4xl font-bold flex items-center gap-3">
        <img
          src="/images/cat.png" 
          alt="cat icon"
          className="w-10 h-10 object-contain"
        />
        Manage Your Cats
      </h1>

      {/* ---------------------------
          Cards 1–4 (ดูข้อมูล 4 ช่อง)
      ---------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl">
        {allPets.map((pet, i) => (
          <div
            key={i}
            className={`p-4 rounded-2xl shadow-md cursor-pointer border-2
            ${selectedSlot === i + 1 ? "border-pink-500" : "border-gray-200"}
          `}
            onClick={() => setSelectedSlot(i + 1)}
          >
            <div className="w-full h-32 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
              {pet?.image ? (
                <img src={pet.image} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400">No pictures</span>
              )}
            </div>

            <p className="mt-2 font-semibold">Channel {i + 1}</p>
            <p className="text-sm text-gray-600">{pet?.name || "—"}</p>

            {pet?.name && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deletePet(i + 1);
                }}
                className="mt-2 w-full bg-red-500 text-white py-2 rounded-xl hover:bg-red-600"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ---------------------------
          Form Edit Section
      ---------------------------- */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-md p-10">

        <h2 className="text-2xl font-bold mb-6">
          ✏️ Edit channel cat information {selectedSlot}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* Form Left */}
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              type="text"
              className="w-full p-3 border rounded-xl mb-4"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <label className="block text-sm mb-1">Breed</label>
            <div className="flex gap-2 mb-4">
              <select
                className="w-full p-3 border rounded-xl"
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
              >
                <option value="">Choose a breed</option>
                {Object.keys(BREEDS).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {form.breed && (
                <button
                  type="button"
                  onClick={() => openPopup(form.breed, BREEDS[form.breed])}
                  className="bg-gray-200 px-3 py-2 rounded-xl flex items-center justify-center"
                >
                <img src="/images/info.png" className="w-5 h-5" />
                </button>
              )}
            </div>

            <label className="block text-sm mb-1">Color</label>
            <div className="flex gap-2 mb-4">
              <select
                className="w-full p-3 border rounded-xl"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              >
                <option value="">Choose a color</option>
                {Object.keys(CAT_COLORS).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {form.color && (
                <button
                  type="button"
                  onClick={() => openPopup(form.color, CAT_COLORS[form.color])}
                  className="bg-gray-200 px-3 py-2 rounded-xl flex items-center justify-center"
                >
                <img src="/images/color.png" className="w-5 h-5" />
                </button>
              )}
            </div>

            <label className="block text-sm mb-1">Age</label>
            <input
              type="number"
              className="w-full p-3 border rounded-xl mb-4"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />

            <button
              onClick={savePet}
              className="mt-2 w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl font-semibold"
            >
              Save cat information
            </button>
          </div>

          {/* Preview image */}
          <div className="flex flex-col items-center">
            <p className="font-medium mb-2">Cat Picture</p>

            <div className="w-64 h-64 bg-gray-50 border rounded-2xl overflow-hidden">
              {preview ? (
                <img src={preview} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No pictures
                </div>
              )}
            </div>

            <label className="mt-4 cursor-pointer bg-gray-100 px-4 py-2 rounded-xl">
              Select picture
              <input type="file" className="hidden" onChange={handleImage} />
            </label>
          </div>
        </div>
      </div>

      {/* Popup */}
      {popup.open && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-2xl max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-3">{popup.title}</h2>
            <img src={popup.img} className="w-full h-64 object-cover rounded-xl mb-3" />
            <p className="text-gray-700 text-sm mb-4">{popup.desc}</p>

            <button
              onClick={() => setPopup({ open: false })}
              className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-xl w-full"
            >
              Turn off
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
