import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
// ⭐ IMPORT เฉพาะ BREEDS และ CAT_COLORS ที่มีอยู่ใน petData.js
import { 
    BREEDS, 
    CAT_COLORS, 
} from "../petData"; 

import THAI_PROVINCES from "../thaiProvinces";


// 💡 MODIFIED COMPONENT: Modal สำหรับเลือกเงื่อนไขการจับคู่ (เพิ่ม Petdreegree Yes/No)
const PetdreegreeSelectionModal = ({ 
  isOpen, 
  onClose, 
  onStartPairing,
  selectedPet,
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
  // ⭐ NEW: State สำหรับเงื่อนไข Petdreegree (Yes/No)
  const [hasPedigree, setHasPedigree] = useState("Any");

  if (!isOpen || !selectedPet) return null;

  const handleStart = () => {
    // 💡 ส่งเงื่อนไขการจับคู่ รวมถึงค่า hasPedigree กลับไป
    onStartPairing(selectedPet, { breed, color, age, gender, province, hasPedigree });
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

          {/* ⭐ NEW: Petdreegree Yes/No (วางก่อน Address) */}
          <label className="block">
            <span className="text-gray-700 font-semibold">Petdreegree Certificate</span>
            <select
              value={hasPedigree}
              onChange={(e) => setHasPedigree(e.target.value)}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm p-3 focus:ring-pink-500 focus:border-pink-500 bg-pink-50 border-pink-200"
            >
              <option value="Any">Any</option>
              <option value="Yes">Yes (Has Certificate)</option>
              <option value="No">No (No Certificate)</option>
            </select>
          </label>

          {/* จังหวัด (Province) */}
          <label className="block">
            <span className="text-gray-700 font-semibold">Address</span>
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
              bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700
            `}
          >
            Start Pairing
          </button>
        </div>
      </div>
    </div>
  );
};

const getGenderImage = (gender) => {
    if (gender === "Male") return { img: "/images/male.png", color: "text-blue-600" };
    if (gender === "Female") return { img: "/images/female.png", color: "text-pink-600" };
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

  const loadAllPets = async () => {
    const results = [];
    for (let i = 1; i <= 4; i++) {
      try {
        const res = await api.get(`/api/pets/${i}`);
        results.push({
          ...res.data,
          image: fixImage(res.data?.image), 
          PetdreegreeImage: fixImage(res.data?.PetdreegreeImage),
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
        setSelectedPet({ 
            ...pet, 
            slot: index + 1, 
            province: pet.province || "", 
        });
    };

    const handleOpenCriteriaModal = () => {
        if (!selectedPet || isEmptyPet(selectedPet)) {
            alert("Please select a cat first.");
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
    
    const localAgeOptions = [ "Any", "0-1", "1-3", "3-7", "7+" ];
    const localGenderOptions = [ "Any", "Male", "Female" ];
    const localProvinceOptions = [ "Any", ...THAI_PROVINCES ];


  return (
    <div className="w-full flex flex-col items-center py-12 px-4 gap-12 bg-gray-50 min-h-screen">
      
      <PetdreegreeSelectionModal 
        isOpen={isCriteriaModalOpen}
        onClose={() => setIsCriteriaModalOpen(false)}
        onStartPairing={handleStartPairing}
        selectedPet={selectedPet}
        breedOptions={["Any", ...Object.keys(BREEDS)]} 
        colorOptions={["Any", ...Object.keys(CAT_COLORS)]} 
        ageOptions={localAgeOptions}
        genderOptions={localGenderOptions}
        provinceOptions={localProvinceOptions}
      />

      <div className="w-full flex justify-end max-w-6xl">
        <button
          onClick={handleManagePet}
          className="px-6 py-2 rounded-full text-sm font-semibold text-gray-700 border-2 border-gray-300 hover:bg-white transition-colors flex items-center gap-2 shadow-sm"
        >
          Manage Pets 
          <img src="/images/cat.png" alt="Cat" className="w-4 h-4" />
        </button>
      </div>

      <h1 className="text-4xl font-black flex items-center gap-3 text-gray-800">
        <img src="/images/love.png" className="w-10 h-10" alt="Heart" />
        Match Your Cat
      </h1>

      <p className="text-gray-600 text-lg text-center max-w-2xl">
        **1. Select a cat** from the channels below, then **2. Press Go to Petdreegree** to define criteria.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-6xl">
        {pets.map((pet, index) => {
          const empty = isEmptyPet(pet);
          const isSelected = selectedPet?.slot === index + 1;
          const genderData = pet?.gender ? getGenderImage(pet.gender) : null;

          return (
            <div
              key={index}
              onClick={() => handleSelectSlot(pet, index)}
              className={`
                p-6 rounded-[2.5rem] shadow-md border-2 flex flex-col transition-all bg-white relative
                ${isSelected ? "border-pink-500 shadow-xl ring-4 ring-pink-100 scale-105" : "border-gray-100 hover:border-pink-200"}
                ${empty ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
              style={{ minHeight: "450px" }}
            >
              <div className="w-full h-48 bg-gray-50 rounded-[2rem] overflow-hidden flex items-center justify-center shadow-inner">
                {pet?.image ? (
                  <img src={pet.image} className="w-full h-full object-cover" alt="Cat" />
                ) : (
                  <span className="text-gray-300 font-bold">Slot Empty</span>
                )}
              </div>

              <p className="mt-5 font-black text-xl text-gray-800 flex items-center gap-2 border-b pb-2">
                <img src="/images/paw-decor.png" className="w-5 h-5" alt="Paw" />
                Channel {index + 1}
              </p>

              <div className="text-sm text-gray-600 leading-relaxed mt-3 space-y-1">
                <p><strong className="text-gray-800">Name:</strong> {pet?.name || "—"}</p>
                <p><strong className="text-gray-800">Breed:</strong> {pet?.breed || "—"}</p>
                <p><strong className="text-gray-800">Color:</strong> {pet?.color || "—"}</p>
                <p><strong className="text-gray-800">Age:</strong> {pet?.age ? `${pet.age} yrs` : "—"}</p>
                <p className="flex items-center gap-1">
                  <strong className="text-gray-800">Gender:</strong> 
                  {genderData && <img src={genderData.img} className="w-4 h-4 ml-1" alt="Icon" />}
                  <span className={genderData?.color || ''}>{pet.gender || '—'}</span>
                </p>
                
                {/* ⭐ NEW: แสดง Petdreegree Yes/No ใน Card */}
                <p>
                    <strong className="text-gray-800">Petdreegree:</strong>{" "}
                    {!empty ? (
                        pet?.PetdreegreeImage ? (
                            <span className="text-green-600 font-bold">Yes</span>
                        ) : (
                            <span className="text-red-500 font-bold">No</span>
                        )
                    ) : "—"}
                </p>

                

                <p className="flex items-center gap-1">
                    <img src="/images/location.png" className="w-4 h-4" alt="Loc" />
                    <strong className="text-gray-800">Address:</strong> {pet?.province || "—"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleOpenCriteriaModal} 
        disabled={!selectedPet}
        className={`
          mt-6 px-16 py-4 rounded-[2rem] text-xl font-black shadow-xl text-white
          transition-all active:scale-95
          ${!selectedPet 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-gradient-to-r from-pink-500 to-pink-600 hover:shadow-pink-200'
          }
        `}
      >
        Go to Petdreegree
      </button>
    </div>
  );
}