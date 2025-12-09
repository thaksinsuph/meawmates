import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

// 💡 NEW COMPONENT: Modal สำหรับเลือกเงื่อนไขการจับคู่ (Petdreegree Selection)
// Note: นำเข้าตัวเลือกจากไฟล์ภายนอกในโลกจริง
const PetdreegreeSelectionModal = ({ 
  isOpen, 
  onClose, 
  onStartPairing,
  selectedPet,
}) => {
  // State สำหรับเก็บเงื่อนไขที่เลือก
  const [breed, setBreed] = useState("Any");
  const [color, setColor] = useState("Any");
  const [age, setAge] = useState("Any");
  const [gender, setGender] = useState("Any");

  if (!isOpen || !selectedPet) return null;

  const handleStart = () => {
    // 💡 ส่งเงื่อนไขการจับคู่และข้อมูลแมวของเรากลับไป
    onStartPairing(selectedPet, { breed, color, age, gender });
  };
  
  // *** ข้อมูลตัวเลือก (สามารถดึงมาจาก API หรือ constants ได้) ***
  const breedOptions = ["Any", "Siamese", "Persian", "Scottish Fold", "Maine Coon", "Bengal", "Ragdoll"];
  const colorOptions = ["Any", "White", "Black", "Orange", "Calico", "Tabby", "Gray", "Cream"];
  const ageOptions = ["Any", "0-1", "1-3", "3-7", "7+"]; // ช่วงอายุ
  const genderOptions = ["Any", "Male", "Female"];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-2xl transform transition-all scale-100 duration-300">
        
        <h2 className="text-3xl font-extrabold text-pink-600 mb-6 border-b pb-3 flex items-center gap-2">
          <img src="/images/paw-decor.png" className="w-7 h-7" alt="Paw" />
          Petdreegree Criteria for: {selectedPet.name}
        </h2>
        
        <p className="text-gray-600 mb-6">
            Define the criteria for cats you want to see. 
            <span className="font-semibold text-pink-500">(Any = No filter)</span>
        </p>

        <div className="grid grid-cols-2 gap-6">
          {/* สายพันธุ์ (Breed) */}
          <label className="block">
            <span className="text-gray-700 font-semibold">Breed</span>
            <select
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm p-3 focus:ring-pink-500 focus:border-pink-500"
            >
              {breedOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>

          {/* สี (Color) */}
          <label className="block">
            <span className="text-gray-700 font-semibold">Color</span>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm p-3 focus:ring-pink-500 focus:border-pink-500"
            >
              {colorOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>
          
          {/* อายุ (Age) */}
          <label className="block">
            <span className="text-gray-700 font-semibold">Age Group (Years)</span>
            <select
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm p-3 focus:ring-pink-500 focus:border-pink-500"
            >
              {ageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>
          
          {/* เพศ (Gender) */}
          <label className="block">
            <span className="text-gray-700 font-semibold">Gender</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm p-3 focus:ring-pink-500 focus:border-pink-500"
            >
              {genderOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>
        </div>
        
        {/* BUTTONS ของ Modal */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-md font-semibold text-gray-700 border-2 border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            className={`
              px-8 py-3 rounded-xl text-lg font-extrabold shadow-lg text-white transition-all
              bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 hover:shadow-pink-300
            `}
          >
            Start Pairing
          </button>
        </div>
      </div>
    </div>
  );
};


export default function Matching() {
  const navigate = useNavigate();

  const [pets, setPets] = useState([{}, {}, {}, {}]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false); 

  const backendBase = import.meta.env.VITE_API_URL.replace("/api", "");

  const fixImage = (img) => {
    if (!img) return null;
    if (img.startsWith("data:")) return img;
    if (img.startsWith("http")) return img;
    if (img.startsWith("/images/")) return img;
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
          slot: i,
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

  /* ------------------ 1. SELECT SLOT (คลิกที่ Card) ------------------ */
  const handleSelectSlot = (pet, index) => {
    if (isEmptyPet(pet)) {
      alert("No cat saved in this slot. Please manage your pets first.");
      setSelectedPet(null);
      return;
    }
    setSelectedPet({ ...pet, slot: index + 1 });
  };

  /* ------------------ 2. OPEN CRITERIA MODAL (กดปุ่ม Petdreegree) ------------------ */
  const handleOpenCriteriaModal = () => {
    if (!selectedPet || isEmptyPet(selectedPet)) {
        alert("Please select a cat from the channels above before defining Petdreegree criteria.");
        return;
    }
    setIsCriteriaModalOpen(true);
  };

  /* ------------------ 3. START PAIRING (จากใน Modal) ------------------ */
  const handleStartPairing = (pet, criteria) => {
    // รวมข้อมูลแมวของเรา (minimalPet) และเงื่อนไขการค้นหา (criteria)
    const dataToSave = {
        pet: {
            slot: pet.slot,
            name: pet.name,
            breed: pet.breed,
            color: pet.color,
            age: pet.age,
            gender: pet.gender,
        },
        criteria: criteria // { breed, color, age, gender }
    };

    // 💡 เก็บข้อมูลทั้งหมดไว้ใน Local Storage
    localStorage.setItem("matchingData", JSON.stringify(dataToSave));
    
    setIsCriteriaModalOpen(false); // ปิด Modal
    navigate("/matching/swipe"); // ไปหน้า SwipeMatch.jsx
  };


  /* ------------------ MANAGE PET BUTTON ------------------ */
  const handleManagePet = () => {
    navigate("/manage-pet"); 
  };
  /* ------------------------------------------------------------------ */


  /* ============================================================
    UI
  ============================================================ */
  return (
    <div className="w-full flex flex-col items-center py-12 px-4 gap-12">
      
      {/* ------------------ Modal Component ------------------ */}
      <PetdreegreeSelectionModal 
        isOpen={isCriteriaModalOpen}
        onClose={() => setIsCriteriaModalOpen(false)}
        onStartPairing={handleStartPairing}
        selectedPet={selectedPet}
      />

      {/* ------------------ MANAGE PET BUTTON SECTION ------------------ */}
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
            src="/images/cat.png" 
            alt="Cat Icon"
            className="w-4 h-4"
          />
        </button>
      </div>

      <h1 className="text-4xl font-bold flex items-center gap-3 text-gray-800">
        <img src="/images/love.png" className="w-10 h-10" alt="Heart Icon" />
        Match Your Cat
      </h1>

      <p className="text-gray-600 text-lg">
        **1. Select a cat** from the channels below, then **2. Press Go to Petdreegree** to define criteria.
      </p>

      {/* PET LIST */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-6xl">
        {pets.map((pet, index) => {
          const empty = isEmptyPet(pet);
          const isSelected = selectedPet?.slot === index + 1;

          return (
            <div
              key={index}
              onClick={() => handleSelectSlot(pet, index)}
              className={`
                p-6 rounded-3xl shadow-md border-2 flex flex-col transition-all bg-white
                hover:shadow-xl hover:-translate-y-1 hover:bg-pink-50/60
                ${isSelected ? "border-pink-500 shadow-xl ring-4 ring-pink-100" : "border-gray-200"}
                ${empty ? "opacity-40 cursor-not-allowed hover:translate-y-0 hover:shadow-md" : "cursor-pointer"}
              `}
              style={{ minHeight: "380px" }}
            >
              {isSelected && (
                <div className="absolute top-2 right-4 text-pink-500 text-xl font-extrabold">✅ Selected</div>
              )}

              {/* CAT IMAGE */}
              <div className="w-full h-56 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                {pet?.image ? (
                  <img
                    src={fixImage(pet.image)}
                    className="w-full h-full object-cover"
                    alt={pet.name || 'Pet Image'}
                  />
                ) : (
                  <span className="text-gray-400">No information</span>
                )}
              </div>

              {/* SLOT TITLE */}
              <p className="mt-4 font-bold text-xl text-gray-800 flex items-center gap-2">
                <img src="/images/paw-decor.png" className="w-5 h-5 opacity-80" alt="Paw" />
                Channel {index + 1}
              </p>

              {/* DETAILS */}
              <div className="text-sm text-gray-600 leading-6 mt-2 space-y-1">
                <p><strong>Name:</strong> {pet?.name || "—"}</p>
                <p><strong>Breed:</strong> {pet?.breed || "—"}</p>
                <p><strong>Color:</strong> {pet?.color || "—"}</p>
                <p><strong>Age:</strong> {pet?.age ? `${pet.age} yrs` : "—"}</p>
                <p>
                  <strong>Gender:</strong> 
                  {pet?.gender ? (
                    <span className={pet.gender === 'Male' ? 'text-blue-600' : 'text-pink-600'}>
                      {pet.gender} {pet.gender === 'Male' ? '♂️' : '♀️'}
                    </span>
                  ) : '—'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* NEXT BUTTON (เปิด Modal) */}
      <button
        onClick={handleOpenCriteriaModal} 
        disabled={!selectedPet || isEmptyPet(selectedPet)}
        className={`
          mt-6 px-14 py-4 rounded-2xl text-lg font-extrabold shadow-lg text-white
          transition-all
          ${!selectedPet || isEmptyPet(selectedPet) 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 hover:shadow-pink-300'
          }
        `}
      >
        Go to Petdreegree
      </button>
    </div>
  );
}