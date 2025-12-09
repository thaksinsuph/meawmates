import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

// 💡 Component สำหรับ Modal เลือกสัตว์เลี้ยง
const PetSelectionModal = ({ 
  pets, 
  isOpen, 
  onClose, 
  onSelect,
  selectedPet,
  fixImage,
  isEmptyPet
}) => {
  if (!isOpen) return null;

  // ตรวจสอบว่ามีสัตว์เลี้ยงที่เลือกแล้วหรือไม่
  const isPetSelected = selectedPet && !isEmptyPet(selectedPet);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl transform transition-all scale-100 duration-300">
        <h2 className="text-3xl font-extrabold text-pink-600 mb-6 border-b pb-3 flex items-center gap-2">
          <img src="/images/paw-decor.png" className="w-7 h-7" />
          Select Your Cat for Petdreegree
        </h2>
        
        {/* PET LIST ใน Modal */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto max-h-[60vh]">
          {pets.map((pet, index) => {
            const empty = isEmptyPet(pet);
            const isSelected = selectedPet?.slot === index + 1;
            
            // เพิ่ม slot เข้าไปใน object เพื่อให้ onSelect รู้ว่าเลือกช่องไหน
            const petWithSlot = { ...pet, slot: index + 1 }; 

            return (
              <div
                key={index}
                // ถ้าไม่ว่าง ให้เรียก onSelect เมื่อคลิก
                onClick={() => !empty && onSelect(petWithSlot)}
                className={`
                  p-4 rounded-2xl border-2 flex flex-col transition-all bg-white
                  ${empty 
                    ? "opacity-50 cursor-not-allowed border-gray-100" 
                    : "cursor-pointer hover:bg-pink-50/60 hover:shadow-lg"
                  }
                  ${isSelected ? "border-pink-500 shadow-xl ring-4 ring-pink-100" : "border-gray-200"}
                `}
              >
                {/* CAT IMAGE */}
                <div className="w-full h-32 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                  {pet?.image ? (
                    <img
                      src={fixImage(pet.image)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">No Cat</span>
                  )}
                </div>

                {/* DETAILS ใน Modal */}
                <p className="mt-3 font-bold text-lg text-gray-800">
                  {pet?.name || `Channel ${index + 1}`}
                </p>
                <div className="text-xs text-gray-600 leading-5 mt-1">
                  <p><strong>Breed:</strong> {pet?.breed || "—"}</p>
                  <p><strong>Color:</strong> {pet?.color || "—"}</p>
                  <p><strong>Age:</strong> {pet?.age ? `${pet.age} yrs` : "—"}</p>
                  <p>
                    <strong>Gender:</strong> 
                    {pet?.gender ? (
                      <span className={pet.gender === 'Male' ? 'text-blue-600' : 'text-pink-600'}>
                        {pet.gender}
                      </span>
                    ) : '—'}
                  </p>
                </div>
                {isSelected && (
                    <p className="mt-2 text-pink-500 font-semibold text-sm">✅ Selected</p>
                )}
              </div>
            );
          })}
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
            // เรียก onSelect พร้อม flag เพื่อเริ่ม Pairing
            onClick={() => onSelect(selectedPet, true)} 
            disabled={!isPetSelected}
            className={`
              px-8 py-3 rounded-xl text-lg font-extrabold shadow-lg text-white transition-all
              ${isPetSelected
                ? 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 hover:shadow-pink-300'
                : 'bg-gray-400 cursor-not-allowed'
              }
            `}
          >
            Start Pairing
          </button>
        </div>
      </div>
    </div>
  );
};


/* ============================================================
   MATCHING COMPONENT
============================================================ */
export default function Matching() {
  const navigate = useNavigate();

  const [pets, setPets] = useState([{}, {}, {}, {}]);
  const [selectedPet, setSelectedPet] = useState(null);
  // ⭐ NEW STATE: สำหรับควบคุมการแสดง Modal
  const [isModalOpen, setIsModalOpen] = useState(false); 

  // ⭐ ใช้ API URL ของ backend เพื่อสร้าง path รูป
  const backendBase = import.meta.env.VITE_API_URL.replace("/api", "");

  // ⭐ Normalize รูปสัตว์เลี้ยงให้ใช้ได้จริงตอน Deploy
  const fixImage = (img) => {
    if (!img) return null;

    if (img.startsWith("data:")) return img;     // Base64
    if (img.startsWith("http")) return img;     // Google หรือ external
    if (img.startsWith("/images/")) return img;  // frontend static

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
          slot: i, // 💡 เพิ่ม slot เข้าไปใน object ทันที
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

  /* ------------------ OLD: handleSelectSlot - ไม่ได้ใช้แล้ว ------------------ */
  // เนื่องจากเราจะจัดการการเลือกทั้งหมดใน Modal
  
  /* ------------------ OLD: handleNext - ถูกแทนที่ด้วย handleStartPairing ------------------ */
  const handleStartPairing = (petToStart) => {
    const pet = petToStart || selectedPet;
    
    if (!pet || isEmptyPet(pet)) {
      alert("Please select a cat before starting pairing.");
      return;
    }
    
    const minimalPet = {
      slot: pet.slot,
      name: pet.name,
      breed: pet.breed,
      color: pet.color,
      age: pet.age,
      gender: pet.gender,
    };

    localStorage.setItem("selectedPet", JSON.stringify(minimalPet));
    setIsModalOpen(false); // ปิด Modal ก่อนนำทาง
    navigate("/matching/swipe"); 
  };
  
  /* ------------------ NEW: SELECT PET/START PAIRING LOGIC ------------------ */
  const handleSelectPetInModal = (pet, isStartPairing = false) => {
    if (isEmptyPet(pet)) return;
    
    // ⭐ ถ้าเป็นการกด "Start Pairing" ใน Modal
    if (isStartPairing) {
      handleStartPairing(pet);
    } else {
      // ⭐ ถ้าเป็นการเลือก pet (คลิกที่ card) ใน Modal
      setSelectedPet(pet);
    }
  };
  
  // 💡 ฟังก์ชันเปิด Modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
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
      
      {/* ------------------ 1. Modal Component ------------------ */}
      <PetSelectionModal 
        pets={pets}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectPetInModal}
        selectedPet={selectedPet}
        fixImage={fixImage}
        isEmptyPet={isEmptyPet}
      />
      {/* -------------------------------------------------------- */}


      {/* ------------------ 2. MANAGE PET BUTTON SECTION ------------------ */}
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

      {/* ------------------ 3. PET LIST (คลิกที่ Card เพื่อเปิด Modal) ------------------ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-6xl">
        {pets.map((pet, index) => {
          const empty = isEmptyPet(pet);
          const isSelected = selectedPet?.slot === index + 1;

          return (
            <div
              key={index}
              onClick={handleOpenModal} // 👈 คลิกที่ Card เปิด Modal แทนการเลือก
              className={`
                p-6 rounded-3xl shadow-md border-2 flex flex-col transition-all bg-white
                hover:shadow-xl hover:-translate-y-1 hover:bg-pink-50/60
                ${isSelected ? "border-pink-500 shadow-xl" : "border-gray-200"}
                ${empty ? "opacity-40 cursor-pointer hover:translate-y-0 hover:shadow-md" : "cursor-pointer"}
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
                Channel {index + 1} {isSelected && ' (Selected)'}
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

      {/* ------------------ 4. NEXT BUTTON (เปลี่ยนเป็นเปิด Modal) ------------------ */}
      <button
        onClick={handleOpenModal} 
        className="
          mt-6 px-14 py-4 rounded-2xl text-lg font-extrabold shadow-lg text-white
          bg-gradient-to-r from-pink-500 to-pink-600
          hover:from-pink-600 hover:to-pink-700 hover:shadow-pink-300
          transition-all
        "
      >
        Go to Petdreegree (Select Pet)
      </button>
    </div>
  );  
}