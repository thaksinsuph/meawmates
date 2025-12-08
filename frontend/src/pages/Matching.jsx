import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

// Helper function สำหรับแสดงผลเพศ (ใช้รูปภาพ)
const getGenderDisplay = (gender) => {
    if (gender === 'Male') {
        return (
            <span className="flex items-center gap-1 text-blue-600 font-medium">
                <img src="/images/male.png" className="w-4 h-4 object-contain" alt="Male"/>
                Male
            </span>
        );
    }
    if (gender === 'Female') {
        return (
            <span className="flex items-center gap-1 text-pink-600 font-medium">
                <img src="/images/female.png" className="w-4 h-4 object-contain" alt="Female"/>
                Female
            </span>
        );
    }
    return '—';
};

export default function Matching() {
  const navigate = useNavigate();

  const [pets, setPets] = useState([{}, {}, {}, {}]);
  const [selectedPet, setSelectedPet] = useState(null);

  // ⭐ ใช้ API URL ของ backend เพื่อสร้าง path รูป
  const backendBase = import.meta.env.VITE_API_URL.replace("/api", "");

  // ⭐ Normalize รูปสัตว์เลี้ยงให้ใช้ได้จริงตอน Deploy
  const fixImage = (img) => {
    if (!img) return null;

    if (img.startsWith("data:")) return img;     // Base64
    if (img.startsWith("http")) return img;      // Google หรือ external
    if (img.startsWith("/images/")) return img;  // frontend static

    // รูปที่ backend ส่งมา เช่น /uploads/xxxx.jpg
    return `${backendBase}${img.startsWith("/") ? img : "/" + img}`;
  };

  const isEmptyPet = (pet) =>
    !pet || (!pet.name && !pet.breed && !pet.color && !pet.age && !pet.image);

  /* ------------------ LOAD PETS (4 slots) ------------------ */
  const loadAllPets = async () => {
    const results = [];

    for (let i = 1; i <= 4; i++) {
      try {
        const res = await api.get(`/api/pets/${i}`);

        results.push({
          ...res.data,
          image: fixImage(res.data?.image),
          vaccineImage: fixImage(res.data?.vaccineImage),
        });
      } catch {
        results.push({});
      }
    }

    setPets(results);
  };

  useEffect(() => {
    loadAllPets();
  }, []);

  /* ------------------ SELECT SLOT ------------------ */
  const handleSelectSlot = (pet, index) => {
    if (isEmptyPet(pet)) return alert("No cat saved in this slot.");

    setSelectedPet({ ...pet, slot: index + 1 });
  };

  /* ------------------ NEXT BUTTON (Start Pairing) ------------------ */
  const handleNext = () => {
    if (!selectedPet) return alert("Please select a cat.");

    const minimalPet = {
      slot: selectedPet.slot,
      name: selectedPet.name,
      breed: selectedPet.breed,
      color: selectedPet.color,
      age: selectedPet.age,
      gender: selectedPet.gender,
    };

    localStorage.setItem("selectedPet", JSON.stringify(minimalPet));
    navigate("/matching/swipe");
  };

  /* ------------------ NEW: MANAGE PET BUTTON ------------------ */
  const handleManagePet = () => {
    // นำทางไปยังหน้า managepet.jsx (สมมติว่า path คือ /managepet)
    navigate("/manage-pet"); 
  };
  /* ------------------------------------------------------------------ */


  /* ============================================================
    UI
  ============================================================ */
  return (
    <div className="w-full flex flex-col items-center py-12 px-4 gap-12">
      
      {/* ------------------ NEW: MANAGE PET BUTTON SECTION ------------------ */}
      <div className="w-full flex justify-end max-w-6xl">
        <button
          onClick={handleManagePet}
          className="
            px-6 py-2 rounded-full text-sm font-semibold text-gray-700 border-2 border-gray-300
            hover:bg-gray-100 transition-colors flex items-center gap-2
          "
        >
         Manage Pets 
          <img 
            src="/images/cat.png" // ⭐⭐ เปลี่ยนเป็นรูปที่คุณต้องการ
            alt="Cat Icon"
            className="w-4 h-4"
            
          />
        </button>
      </div>
      {/* -------------------------------------------------------------------- */}

      <h1 className="text-4xl font-bold flex items-center gap-3 text-gray-800">
        <img src="/images/love.png" className="w-10 h-10" />
        Match Your Cat
      </h1>

      <p className="text-gray-600 text-lg">Select one cat to start pairing.</p>

      {/* PET LIST */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-6xl">
        {pets.map((pet, index) => {
          const empty = isEmptyPet(pet);

          return (
            <div
              key={index}
              onClick={() => handleSelectSlot(pet, index)}
              className={`
                p-6 rounded-3xl shadow-md border-2 flex flex-col transition-all bg-white
                hover:shadow-xl hover:-translate-y-1 hover:bg-pink-50/60
                ${selectedPet?.slot === index + 1 ? "border-pink-500 shadow-xl" : "border-gray-200"}
                ${empty ? "opacity-40 cursor-not-allowed hover:translate-y-0 hover:shadow-md" : "cursor-pointer"}
              `}
              style={{ minHeight: "380px" }}
            >

              {/* CAT IMAGE */}
              <div className="w-full h-56 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                {pet?.image ? (
                  <img
                    src={fixImage(pet.image)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400">No information</span>
                )}
              </div>

              {/* SLOT TITLE */}
              <p className="mt-4 font-bold text-xl text-gray-800 flex items-center gap-2">
                <img src="/images/paw-decor.png" className="w-5 h-5 opacity-80" />
                Channel {index + 1}
              </p>

              {/* DETAILS */}
              <div className="text-sm text-gray-600 leading-6 mt-2 space-y-1">
                <p><strong>Name:</strong> {pet?.name || "—"}</p>
                <p><strong>Breed:</strong> {pet?.breed || "—"}</p>
                <p><strong>Color:</strong> {pet?.color || "—"}</p>
                <p><strong>Age:</strong> {pet?.age ? `${pet.age} yrs` : "—"}</p>
                <p className="flex items-center gap-1">
                  <strong>Gender:</strong> 
                  {getGenderDisplay(pet?.gender)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* NEXT BUTTON */}
      <button
        onClick={handleNext}
        className="
          mt-6 px-14 py-4 rounded-2xl text-lg font-extrabold shadow-lg text-white
          bg-gradient-to-r from-pink-500 to-pink-600
          hover:from-pink-600 hover:to-pink-700 hover:shadow-pink-300
          transition-all
        "
      >
        Start Pairing
      </button>
    </div>
  );
}