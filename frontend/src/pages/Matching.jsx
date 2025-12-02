import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Matching() {
  const navigate = useNavigate();

  const [pets, setPets] = useState([{}, {}, {}, {}]);
  const [selectedPet, setSelectedPet] = useState(null);

  // ---------------------------------------------------
  // 🐾 ตรวจสอบว่า slot ว่างหรือไม่ (กันบัคกดไม่ได้)
  // ---------------------------------------------------
  const isEmptyPet = (pet) => {
    if (!pet) return true;
    return (
      !pet.name &&
      !pet.breed &&
      !pet.color &&
      !pet.age &&
      !pet.image
    );
  };

  // ---------------------------------------------------
  // 🐾 โหลดแมว 4 ช่องทั้งหมด
  // ---------------------------------------------------
  const loadAllPets = async () => {
    const results = [];
    for (let i = 1; i <= 4; i++) {
      try {
        const res = await api.get(`/api/pets/${i}`);
        results.push(res.data || {});
      } catch {
        results.push({});
      }
    }
    setPets(results);
  };

  useEffect(() => {
    loadAllPets();
  }, []);

  // ---------------------------------------------------
  // 🐾 เลือกแมว 1 ช่อง
  // ---------------------------------------------------
  const handleSelectSlot = (pet, index) => {
    if (isEmptyPet(pet)) {
      alert("No cat saved in this slot.");
      return;
    }
    setSelectedPet({ ...pet, slot: index + 1 });
  };

  // ---------------------------------------------------
  // 🐾 ไปหน้า SwipeMatch (แก้ไม่ให้เก็บรูปใหญ่)
  // ---------------------------------------------------
  const handleNext = () => {
    if (!selectedPet) {
      return alert("Please select a cat before starting the match.");
    }

    // ❗ เก็บเฉพาะข้อมูลจำเป็น ไม่เก็บ base64 รูป
    const minimalPet = {
      slot: selectedPet.slot,
      name: selectedPet.name,
      breed: selectedPet.breed,
      color: selectedPet.color,
      age: selectedPet.age
    };

    localStorage.setItem("selectedPet", JSON.stringify(minimalPet));
    navigate("/matching/swipe");
  };

  return (
    <div className="w-full flex flex-col items-center py-12 px-4 gap-12">

      {/* Title */}
      <h1 className="text-4xl font-bold flex items-center gap-3">
        <img
          src="/images/love.png"
          alt="love icon"
          className="w-10 h-10 object-contain"
        />
        Match Your Cat
      </h1>

      <p className="text-gray-600">Select 1 cat to enter matching mode.</p>

      {/* Cards 4 Slots */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl">
        {pets.map((pet, index) => {
          const empty = isEmptyPet(pet);

          return (
            <div
              key={index}
              onClick={() => handleSelectSlot(pet, index)}
              className={`p-5 rounded-2xl shadow-md border-2 flex flex-col transition-all
                ${selectedPet?.slot === index + 1
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-200"}
                ${empty ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
              `}
              style={{ minHeight: "300px" }}
            >
              {/* รูปแมว */}
              <div className="w-full h-40 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                {pet?.image ? (
                  <img src={pet.image} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400">No information</span>
                )}
              </div>

              {/* ชื่อช่อง */}
              <p className="mt-3 font-semibold text-lg">Channel {index + 1}</p>

              {/* แสดงข้อมูลแมว */}
              <div className="text-sm text-gray-700 leading-5 mt-1">
                <p><strong>Name:</strong> {pet?.name || "—"}</p>
                <p><strong>Breed:</strong> {pet?.breed || "—"}</p>
                <p><strong>Color:</strong> {pet?.color || "—"}</p>
                <p><strong>Age:</strong> {pet?.age ? `${pet.age} yrs` : "—"}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Button */}
      <button
        onClick={handleNext}
        className="mt-6 bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-xl text-lg font-bold"
      >
        Start pairing
      </button>
    </div>
  );
}
