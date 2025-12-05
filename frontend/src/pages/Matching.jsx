import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Matching() {
  const navigate = useNavigate();

  const [pets, setPets] = useState([{}, {}, {}, {}]);
  const [selectedPet, setSelectedPet] = useState(null);

  

  const isEmptyPet = (pet) => {
    return !pet || (!pet.name && !pet.breed && !pet.color && !pet.age && !pet.image);
  };

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

  const handleSelectSlot = (pet, index) => {
    if (isEmptyPet(pet)) return alert("No cat saved in this slot.");
    setSelectedPet({ ...pet, slot: index + 1 });
  };

  const handleNext = () => {
    if (!selectedPet) return alert("Please select a cat.");

    const minimalPet = {
      slot: selectedPet.slot,
      name: selectedPet.name,
      breed: selectedPet.breed,
      color: selectedPet.color,
      age: selectedPet.age,
    };

    localStorage.setItem("selectedPet", JSON.stringify(minimalPet));
    navigate("/matching/swipe");
  };

  return (
    <div className="w-full flex flex-col items-center py-12 px-4 gap-12">

      {/* Title */}
      <h1 className="text-4xl font-bold flex items-center gap-3 text-gray-800">
        <img src="/images/love.png" alt="love icon" className="w-10 h-10" />
        Match Your Cat
      </h1>

      <p className="text-gray-600 text-lg">Select one cat to start pairing. </p>

      {/* Cards */}
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
              style={{ minHeight: "380px" }}   // ⭐ สูงกว่าเดิม
            >
              {/* Cat Image */}
              <div className="w-full h-56 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                {pet?.image ? (
                  <img src={pet.image} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400">No information</span>
                )}
              </div>

              {/* Slot Title */}
              <p className="mt-4 font-bold text-xl text-gray-800 flex items-center gap-2">
                <img src="/images/paw-decor.png" className="w-5 h-5 opacity-80" />
                Channel {index + 1}
              </p>

              {/* Details */}
              <div className="text-sm text-gray-600 leading-6 mt-2 space-y-1">
                <p><strong>Name:</strong> {pet?.name || "—"}</p>
                <p><strong>Breed:</strong> {pet?.breed || "—"}</p>
                <p><strong>Color:</strong> {pet?.color || "—"}</p>
                <p><strong>Age:</strong> {pet?.age ? `${pet.age} yrs` : "—"}</p>
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
