import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
// ⭐ 1. นำเข้าข้อมูลสายพันธุ์และสี
import { BREEDS, CAT_COLORS } from "../petData"; 

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

// =================================================================
// ⭐ CriteriaModal Component (Pop-up เลือกเกณฑ์)
// =================================================================
const CriteriaModal = ({ isOpen, onClose, selectedCat, onStartPairing }) => {
    
    // ⭐ State สำหรับเก็บค่าเกณฑ์ที่ผู้ใช้เลือก
    const [criteriaForm, setCriteriaForm] = useState({
        targetBreed: '',
        targetAge: 1,
        targetColor: '',
        targetGender: '',
    });

    if (!isOpen || !selectedCat) return null;

    const handleStart = () => {
        // Validation คร่าวๆ (ควรมีฟิลด์หลักอย่างน้อย)
        if (!criteriaForm.targetBreed && !criteriaForm.targetGender) {
            alert("กรุณาเลือกเกณฑ์จับคู่อย่างน้อย 1 เกณฑ์ (เช่น สายพันธุ์ หรือ เพศ)");
            return;
        }
        onStartPairing(criteriaForm);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-fadeIn">
                <h2 className="text-2xl font-extrabold text-gray-800 mb-4">
                    🎯 กำหนดเกณฑ์จับคู่ (Pet Pedigree)
                </h2>
                
                <p className="text-lg mb-4 text-pink-600 font-semibold">
                    แมวของคุณ: {selectedCat.name} ({getGenderDisplay(selectedCat.gender)})
                </p>

                <div className="space-y-4">
                    {/* 1. เลือกสายพันธุ์ */}
                    <div>
                        <label className="block text-sm font-medium mb-1">สายพันธุ์ที่ต้องการ:</label>
                        <select
                            className="w-full p-3 border rounded-xl"
                            value={criteriaForm.targetBreed}
                            onChange={(e) => setCriteriaForm({...criteriaForm, targetBreed: e.target.value})}
                        >
                            <option value="">— เลือกสายพันธุ์ (ไม่บังคับ) —</option>
                            {Object.keys(BREEDS).map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    {/* 2. เลือกสี */}
                    <div>
                        <label className="block text-sm font-medium mb-1">สีที่ต้องการ:</label>
                        <select
                            className="w-full p-3 border rounded-xl"
                            value={criteriaForm.targetColor}
                            onChange={(e) => setCriteriaForm({...criteriaForm, targetColor: e.target.value})}
                        >
                            <option value="">— เลือกสี (ไม่บังคับ) —</option>
                            {Object.keys(CAT_COLORS).map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-4">
                        {/* 3. เลือกอายุ */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">อายุสูงสุด (ปี):</label>
                            <input
                                type="number"
                                min="1" max="20"
                                className="w-full p-3 border rounded-xl"
                                value={criteriaForm.targetAge}
                                onChange={(e) => setCriteriaForm({...criteriaForm, targetAge: e.target.value})}
                            />
                        </div>
                        
                        {/* 4. เลือกเพศ */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">เพศที่ต้องการ:</label>
                            <select
                                className="w-full p-3 border rounded-xl"
                                value={criteriaForm.targetGender}
                                onChange={(e) => setCriteriaForm({...criteriaForm, targetGender: e.target.value})}
                            >
                                <option value="">— เลือกเพศ (ไม่บังคับ) —</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleStart}
                        className="flex-1 py-3 rounded-xl bg-pink-500 text-white font-semibold hover:bg-pink-600 transition"
                    >
                        เริ่มจับคู่ (Search)
                    </button>
                </div>
            </div>
        </div>
    );
};
// =================================================================

export default function Matching() {
  const navigate = useNavigate();

  const [pets, setPets] = useState([{}, {}, {}, {}]);
  const [selectedPet, setSelectedPet] = useState(null);
  
  // ⭐ State สำหรับควบคุม Modal และ Criteria
  const [criteriaModalOpen, setCriteriaModalOpen] = useState(false); 

  // ⭐ ใช้ API URL ของ backend เพื่อสร้าง path รูป
  const backendBase = import.meta.env.VITE_API_URL.replace("/api", "");

  // ⭐ Normalize รูปสัตว์เลี้ยงให้ใช้ได้จริงตอน Deploy
  const fixImage = (img) => { /* ... Logic เดิม ... */ };

  const isEmptyPet = (pet) =>
    !pet || (!pet.name && !pet.breed && !pet.color && !pet.age && !pet.image);

  /* ------------------ LOAD PETS (4 slots) ------------------ */
  const loadAllPets = async () => { /* ... Logic เดิม ... */ };

  useEffect(() => {
    loadAllPets();
  }, []);

  /* ------------------ SELECT SLOT ------------------ */
  const handleSelectSlot = (pet, index) => {
    if (isEmptyPet(pet)) return alert("No cat saved in this slot.");
    setSelectedPet({ ...pet, slot: index + 1 });
  };

  /* ------------------ NEXT BUTTON (Open Criteria Modal) ------------------ */
  const handleNext = () => {
    if (!selectedPet) return alert("Please select a cat.");
    // ⭐ เปิด Modal แทนการนำทาง
    setCriteriaModalOpen(true);
  };
  
  /* ------------------ NEW: START PAIRING AFTER CRITERIA SELECTED ------------------ */
    const handleStartPairing = (criteria) => {
        if (!selectedPet) return;
        
        // 2. รวบรวมข้อมูลแมวที่เลือกและเกณฑ์ที่ต้องการ
        const pairingData = {
            selectedCat: {
                slot: selectedPet.slot,
                name: selectedPet.name,
                breed: selectedPet.breed,
                color: selectedPet.color,
                age: selectedPet.age,
                gender: selectedPet.gender,
            },
            criteria: criteria,
        };
        
        // 3. เก็บข้อมูลทั้งหมดไว้ใน Local Storage
        localStorage.setItem("pairingData", JSON.stringify(pairingData));
        
        // 4. ปิด Modal และนำทางไปหน้าแสดงผลลัพธ์
        setCriteriaModalOpen(false);
        // ⭐⭐ Route ใหม่สำหรับหน้าแสดงผลลัพธ์
        navigate("/matching/list-result"); 
    };

  /* ------------------ MANAGE PET BUTTON (unchanged) ------------------ */
  const handleManagePet = () => {
    navigate("/manage-pet"); 
  };


  /* ============================================================
    UI
  ============================================================ */
  return (
    <div className="w-full flex flex-col items-center py-12 px-4 gap-12">
      
      {/* ------------------ MANAGE PET BUTTON SECTION (unchanged) ------------------ */}
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
        Go to Petdreegree
      </button>
      
      {/* ⭐⭐ NEW: Criteria Selection Modal ⭐⭐ */}
      <CriteriaModal 
          isOpen={criteriaModalOpen}
          onClose={() => setCriteriaModalOpen(false)}
          selectedCat={selectedPet}
          onStartPairing={handleStartPairing}
      />
    </div>
  );
}