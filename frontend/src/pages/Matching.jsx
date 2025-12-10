import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
// ⭐ 1. IMPORT เฉพาะ BREEDS และ CAT_COLORS ที่มีอยู่ใน petData.js
import { 
    BREEDS, 
    CAT_COLORS, 
} from "../petData"; 

import THAI_PROVINCES from "../thaiProvinces";


// 💡 NEW COMPONENT: Modal สำหรับเลือกเงื่อนไขการจับคู่ (Petdreegree Selection)
const PetdreegreeSelectionModal = ({ 
  isOpen, 
  onClose, 
  onStartPairing,
  selectedPet,
  // ⭐ รับ Options ที่ส่งมา
  breedOptions, 
  colorOptions, 
  ageOptions, 
  genderOptions,
  provinceOptions,
}) => {
  // State สำหรับเก็บเงื่อนไขที่เลือก
  const [breed, setBreed] = useState("Any");
  const [color, setColor] = useState("Any");
  const [age, setAge] = useState("Any");
  const [gender, setGender] = useState("Any");
  const [province, setProvince] = useState("Any");

  if (!isOpen || !selectedPet) return null;

  const handleStart = () => {
    // 💡 ส่งเงื่อนไขการจับคู่และข้อมูลแมวของเรากลับไป
    onStartPairing(selectedPet, { breed, color, age, gender , province});
  };
  
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

          {/* ⭐ NEW: จังหวัด (Province) */}
          <label className="block col-span-2">
            <span className="text-gray-700 font-semibold">Adress</span>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm p-3 focus:ring-pink-500 focus:border-pink-500"
            >
              {provinceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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

// ⭐ 1. เพิ่มฟังก์ชันสำหรับกำหนดรูปภาพเพศ (Copy มาจาก Matching.jsx)
const getGenderImage = (gender) => {
    if (gender === "Male") {
        return { 
            img: "/images/male.png", 
            color: "text-blue-600"
        };
    }
    if (gender === "Female") {
        return { 
            img: "/images/female.png", 
            color: "text-pink-600"
        };
    }
    return null;
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
          // ใช้ fixImage สำหรับรูปภาพใน Slot Card (เพื่อให้รูปจาก Backend แสดงผล)
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

    const handleSelectSlot = (pet, index) => {
        if (isEmptyPet(pet)) {
            alert("No cat saved in this slot. Please manage your pets first.");
            setSelectedPet(null);
            return;
        }
        // ⭐ MODIFIED: ต้องตั้งค่า selectedPet ให้มี province ด้วย
        setSelectedPet({ 
            ...pet, 
            slot: index + 1, 
            // ตรวจสอบว่า province ถูกดึงมาอย่างถูกต้อง
            province: pet.province || "", 
        });
    };

    const handleOpenCriteriaModal = () => {
        if (!selectedPet || isEmptyPet(selectedPet)) {
            alert("Please select a cat from the channels above before defining Petdreegree criteria.");
            return;
        }
        setIsCriteriaModalOpen(true);
    };

    const handleStartPairing = (pet, criteria) => {
        const dataToSave = {
            pet: {
                slot: pet.slot,
                name: pet.name,
                breed: pet.breed,
                color: pet.color,
                age: pet.age,
                gender: pet.gender,
                province: pet.province,
            },
            criteria: criteria
        };
        localStorage.setItem("matchingData", JSON.stringify(dataToSave));
        setIsCriteriaModalOpen(false);
        navigate("/matching/swipe");
    };

    const handleManagePet = () => {
        navigate("/manage-pet");
    };
    
    // ⭐ 2. สร้าง Array สำหรับ Age และ Gender ภายใน Matching component
    const localAgeOptions = [ "Any", "0-1", "1-3", "3-7", "7+" ];
    const localGenderOptions = [ "Any", "Male", "Female" ];
// ⭐ NEW: Options สำหรับจังหวัด
    const localProvinceOptions = [ "Any", ...THAI_PROVINCES ];


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
    
    // ✅ โค้ด Prop ที่ถูกต้อง
    breedOptions={["Any", ...Object.keys(BREEDS)]} 
    colorOptions={["Any", ...Object.keys(CAT_COLORS)]} 
    ageOptions={localAgeOptions}
    genderOptions={localGenderOptions}
    provinceOptions={localProvinceOptions}
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
          const genderData = pet?.gender ? getGenderImage(pet.gender) : null; // ⭐ ดึงข้อมูลเพศ

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
                <div className="absolute top-2 right-4 text-pink-500 text-xl font-extrabold"></div>
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

              {/* DETAILS: จัดเรียงใหม่ให้ Address อยู่ล่างสุด */}
              <div className="text-sm text-gray-600 leading-6 mt-2 space-y-1">
                <p><strong>Name:</strong> {pet?.name || "—"}</p>
                <p><strong>Breed:</strong> {pet?.breed || "—"}</p>
                <p><strong>Color:</strong> {pet?.color || "—"}</p>
                <p><strong>Age:</strong> {pet?.age ? `${pet.age} yrs` : "—"}</p>
                
                {/* Gender (ย้ายมาอยู่เหนือ Address) */}
                <p className="flex items-center gap-1">
                  <strong>
                        {/* 1. แสดงข้อความ "Gender:" ก่อน */}
                        Gender:
                        {/* 2. แสดงรูปภาพ Gender (ถ้ามี) */}
                        {genderData ? (
                            <img 
                                src={genderData.img} 
                                className="w-4 h-4 inline-block align-middle ml-1" 
                                alt={genderData.label || 'Gender Icon'} 
                            />
                        ) : (
                            // Icon default หรือเว้นว่าง
                            <span className="w-4 h-4 inline-block align-middle ml-1"></span> 
                        )} 
                    </strong> 
                  {pet?.gender ? (
                    <span className={genderData?.color || 'text-gray-600'}>
                      {pet.gender}
                    </span>
                  ) : '—'}
                </p>

                {/* ⭐ Address/Province (ย้ายลงมาล่างสุด) */}
                <p className="flex items-center gap-1">
                    <img src="/images/location.png" className="w-4 h-4" alt="Location" />
                    <strong>Adress:</strong> {pet?.province || "—"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* NEXT BUTTON (โค้ดเดิม) */}
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