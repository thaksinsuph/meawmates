import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function SwipeMatch() { 
    const navigate = useNavigate();

    const [matchingData, setMatchingData] = useState(null);
    const [targets, setTargets] = useState([]); 
    const [loading, setLoading] = useState(true);
    
    // ⭐ NEW STATE: สำหรับการดูรูปภาพเต็ม (Gallery Modal)
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [currentImage, setCurrentImage] = useState(null); 

    // ⭐ NEW STATE: สำหรับ Match Modal
    const [matchModal, setMatchModal] = useState({
        open: false,
        cat: null, // แมวที่เรา Match ด้วย
        score: 0,
        ownerId: null, // ID เจ้าของแมวเป้าหมาย (สำหรับ Go to Chat)
    });
    // ⭐ NEW STATE: สำหรับ Animation
    const [animatedTargets, setAnimatedTargets] = useState({}); 

    // ---------------------------------------------------------
    // Compatibility Engine & Utility Functions
    // ---------------------------------------------------------
    
    // Logic Data
    const colorGroups = {
        warm: ["orange", "cream", "brown", "ginger", "gold", "tan"],
        cool: ["gray", "black", "blue", "silver"],
        neutral: ["white"],
        mixed: ["calico", "tabby"],
    };

    // Functions
    const getColorGroup = (color) => {
        if (!color) return "neutral";
        const c = color.toLowerCase();
        for (const group in colorGroups) {
            if (colorGroups[group].some((g) => c.includes(g))) return group;
        }
        return "neutral";
    };

    const breedMatch = {
        Persian: ["Ragdoll", "Himalayan", "British Shorthair"],
        Ragdoll: ["Persian", "British Shorthair"],
        Siamese: ["Burmese", "Oriental Shorthair"],
        Bengal: ["Abyssinian"],
        "British Shorthair": ["Scottish Fold", "Ragdoll"],
    };

    const getBreedScore = (my, target) => {
        if (!my || !target) return 15;
        if (my === target) return 40;
        if (breedMatch[my]?.includes(target)) return 30;
        return 15;
    };

    const getAgeScore = (my, target) => {
        if (!my || !target) return 5;
        const diff = Math.abs(my - target);
        if (diff === 0) return 20;
        if (diff <= 2) return 17;
        if (diff <= 4) return 10;
        return 4;
    };
    
    const getEnergyType = (breed) => {
        const energetic = ["Bengal", "Siamese", "Abyssinian"];
        const chill = ["Persian", "Ragdoll", "British Shorthair"];
        if (energetic.includes(breed)) return "energetic";
        if (chill.includes(breed)) return "chill";
        return "medium";
    };

    const getEnergyScore = (my, target) => {
        if (!my || !target) return 8;
        if (my === target) return 20;
        if (
            (my === "energetic" && target === "chill") ||
            (my === "chill" && target === "energetic")
        )
            return 6;
        return 14;
    };

    const getGenderScore = (my, target) => {
        if (!my || !target) return 5;
        if (my === target) return 10; // เพศเดียวกัน
        if (my !== target) return 25; // เพศตรงข้าม
        return 5;
    };

    const getNameVibe = (my, target) => {
        if (!my || !target) return 0;
        return my[0].toLowerCase() === target[0].toLowerCase() ? 5 : 0;
    };
    
    const calculateMatchScore = (me, target) => {
        if (!me || !target) return 0;

        let score = 0;
        score += getBreedScore(me.breed, target.breed);

        const myGroup = getColorGroup(me.color);
        const tgGroup = getColorGroup(target.color);
        score += myGroup === tgGroup ? 10 : 4;

        score += getAgeScore(me.age, target.age);
        score += getEnergyScore(getEnergyType(me.breed), getEnergyType(target.breed));
        score += getNameVibe(me.name, target.name);

        score += getGenderScore(me.gender, target.gender); 

        return Math.min(100, Math.max(0, Math.round(score)));
    };

    const getGenderImage = (gender) => {
        if (gender === "Male") { return { img: "/images/male.png", color: "text-blue-500", label: "Male" }; }
        if (gender === "Female") { return { img: "/images/female.png", color: "text-pink-500", label: "Female" }; }
        return { img: "/images/unknown.png", color: "text-gray-500", label: "Unknown" };
    };

    // ⭐ NEW: Handle Image Click
    const handleImageClick = (imageSrc) => {
        setCurrentImage(imageSrc);
        setIsImageModalOpen(true);
    };


    // ---------------------------------------------------------
    
    const loadTargetCats = async (criteria) => {
      setLoading(true);
      try {
        const res = await api.get("/api/matching/filtered-cats", { 
          params: criteria 
        }); 
        setTargets(res.data);
      } catch (err) {
        console.error("Load target cats error:", err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      const data = JSON.parse(localStorage.getItem("matchingData"));

      if (!data?.pet || !data?.criteria) {
        navigate("/matching");
        return;
      }

      setMatchingData(data);
      loadTargetCats(data.criteria); 
    }, []);


    /* ---------------------------------------------------------
    // 💡 Handle Like/Dislike (เพิ่ม Animation และ Modal)
    // --------------------------------------------------------- */
    const handleSwipe = async (target, direction) => {
      if (!matchingData?.pet || !target) return;

        const targetId = target._id;
        const score = calculateMatchScore(matchingData.pet, target);
        const animationDirection = direction === "right" ? 'right' : 'left';
        
        // 1. ⭐ เริ่ม Animation
        setAnimatedTargets(prev => ({ ...prev, [targetId]: animationDirection }));

        try {
            const res = await api.post("/api/matching/swipe", {
                myCatSlot: matchingData.pet.slot,
                targetCatId: targetId,
                liked: direction === "right",
            });

            // 2. ⭐ ตรวจสอบ Match และเปิด Modal
            if (res.data.match) {
                setMatchModal({
                    open: true,
                    cat: target,
                    score: score,
                    ownerId: res.data.ownerId, 
                });
            }
        } catch (err) {
            console.error("Swipe error:", err);
        }

        // 3. ⭐ รอ Animation จบ (300ms) แล้วลบ Item ออกจาก List
        setTimeout(() => {
            setTargets(prev => prev.filter(c => c._id !== targetId));
            setAnimatedTargets(prev => {
                const newTargets = { ...prev };
                delete newTargets[targetId];
                return newTargets;
            });
        }, 300); 
    };


    if (loading) 
      return <div className="py-40 text-center text-pink-500 text-2xl font-semibold">Loading potential matches...</div>;
    
    if (!matchingData)
      return <div className="py-40 text-center text-red-500 text-xl">Error: No selected cat data.</div>;
    
    const myCat = matchingData.pet;
    const criteria = matchingData.criteria;

    // ---------------------------------------------------------
    // Match Modal Handlers
    // ---------------------------------------------------------
    const handleGoToChat = () => {
        const ownerId = matchModal.ownerId;
        setMatchModal({ open: false, cat: null, score: 0, ownerId: null });
        navigate(`/messages/${ownerId}`);
    };

    const handleContinueMatching = () => {
        setMatchModal({ open: false, cat: null, score: 0, ownerId: null });
    };
    
    // ⭐ Image Modal Component
    const ImageModal = ({ imageSrc, onClose }) => {
        if (!imageSrc) return null;
        return (
            <div 
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <div 
                    className="max-w-4xl max-h-[90vh] overflow-hidden rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()} // ป้องกันการปิด Modal เมื่อคลิกที่รูป
                >
                    <img 
                        src={imageSrc} 
                        alt="Full size cat image" 
                        className="w-full h-full object-contain"
                    />
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white/30 text-white p-2 rounded-full text-lg font-bold hover:bg-white/50 transition"
                    >
                        ❌
                    </button>
                </div>
            </div>
        );
    };


    /* ============================================================
      UI: LIST VIEW + MATCH MODAL
    ============================================================ */

    return (
      <div className="min-h-screen w-full flex flex-col items-center py-10 px-4 gap-8 
             bg-gradient-to-b from-pink-50 to-purple-50">
          
          {/* ⭐ FULL SIZE IMAGE MODAL */}
          <ImageModal 
              imageSrc={currentImage} 
              onClose={() => setIsImageModalOpen(false)}
          />
          
          {/* ⭐ MATCH MODAL UI */}
          {matchModal.open && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-4 border-pink-300 text-center animate-fadeIn transform scale-105">

                      <h2 className="text-4xl font-extrabold text-pink-600 mb-4 drop-shadow-md tracking-wider">
                          🎉 IT'S A MATCH!
                      </h2>
                      <p className="text-gray-700 text-lg">
                          You and **{matchModal.cat?.name}** are a purr-fect pair!
                      </p>

                      {/* Score Badge in Modal */}
                      <div className="flex justify-center my-6">
                            <div className="w-24 h-24 rounded-full bg-pink-100 border-4 border-pink-400 flex items-center justify-center font-black text-xl text-pink-700 shadow-inner">
                                {matchModal.score}%
                            </div>
                      </div>

                      <img
                          src={matchModal.cat?.image}
                          className="w-full h-48 object-cover rounded-2xl shadow-lg border border-gray-200"
                          alt={matchModal.cat?.name || 'Matched Cat'}
                      />

                      {/* Continue Pairing */}
                      <button
                          onClick={handleContinueMatching}
                          className="bg-indigo-500 text-white py-3 rounded-xl w-full mt-6 font-semibold shadow-md hover:bg-indigo-600 transition"
                      >
                          Continue Selecting 
                      </button>

                      {/* Go to Chat */}
                      <button
                          onClick={handleGoToChat}
                          className="bg-green-500 text-white py-3 rounded-xl w-full mt-3 font-semibold shadow-md hover:bg-green-600 transition"
                      >
                          Start Chatting Now 💬
                      </button>

                  </div>
              </div>
          )}
          {/* ⭐ END MATCH MODAL UI */}

          <h1 className="text-4xl md:text-5xl font-extrabold flex items-center gap-3 text-gray-800 drop-shadow-sm">
            <img src="/images/love.png" className="w-12 h-12" alt="Paw" />
            Petdreegree Results
          </h1>
          
          {/* CRITERIA SUMMARY */}
          <div className="text-center bg-white p-4 rounded-xl shadow-lg border border-pink-200 w-full max-w-4xl">
            <p className="text-xl font-semibold text-gray-700 mb-1">
                Your Cat: <span className="text-pink-600 font-extrabold">{myCat.name}</span>
            </p>
            <p className="text-sm text-gray-500 italic">
                Filtering for: {criteria.breed} / {criteria.color} / {criteria.age} / {criteria.gender}
            </p>
            <button
              onClick={() => navigate("/matching")}
              className="text-indigo-500 text-sm font-semibold hover:text-indigo-700 transition mt-2"
            >
              (Change Selection/Criteria)
            </button>
          </div>

          {/* 2. TARGET CAT LIST */}
          <div className="w-full max-w-4xl space-y-6 pb-12">
            {targets.length === 0 ? (
              <div className="text-center bg-white p-12 rounded-3xl shadow-xl mt-10 border border-gray-300">
                <h2 className="text-2xl text-gray-700 font-semibold mb-3">
                  No potential purr-fect matches found 😿
                </h2>
              </div>
            ) : (
              targets.map((target) => {
                const score = calculateMatchScore(myCat, target);
                const targetGender = getGenderImage(target.gender);
                
                const animation = animatedTargets[target._id];
                const animationClasses = animation === 'right' 
                    ? 'translate-x-[150%] opacity-0 rotate-6 scale-90' 
                    : animation === 'left'
                    ? 'translate-x-[-150%] opacity-0 rotate-[-6deg] scale-90' 
                    : ''; 

                return (
                  <div 
                    key={target._id} 
                    className={`
                        flex items-start gap-4 bg-white shadow-lg border-l-4 border-pink-500/50 p-4 rounded-xl 
                        hover:shadow-xl transition-all duration-300 ease-in-out
                        ${animationClasses}
                        `}
                  >
                    {/* Image (clickable) */}
                    <button 
                        onClick={() => handleImageClick(target.image)}
                        className="flex-shrink-0 focus:outline-none"
                    >
                        <img 
                            src={target.image} 
                            className="w-24 h-24 rounded-lg object-cover flex-shrink-0 shadow-inner"
                            alt={target.name}
                        />
                    </button>

                    {/* Info */}
                    <div className="flex-1">
                        <h2 className="font-extrabold text-xl text-gray-800 mb-1">
                            {target.name}
                        </h2>
                        
                        {/* Details List (ใช้ Label) */}
                        <div className="text-sm text-gray-700 space-y-1">
                            {/* Breed */}
                            <p className="font-medium">
                                <strong>Breed:</strong> {target.breed || "—"}
                            </p>
                            {/* Color */}
                            <p className="font-medium">
                                <strong>Color:</strong> {target.color || "—"}
                            </p>
                            {/* Age */}
                            <p className="font-medium">
                                <strong>Age:</strong> {target.age ? `${target.age} yrs` : "—"}
                            </p>
                        
                            {/* Gender + Match Score (รวมในบรรทัดเดียวกัน) */}
                            <p className="flex items-center gap-3 mt-1">
                                <strong>Gender:
                                  {targetGender.img && (
                                      <img src={targetGender.img} className="w-4 h-4 inline-block align-middle ml-1" alt={targetGender.label} />
                                  )}
                                </strong> 
                                <span className={`font-semibold ${targetGender.color}`}>
                                    {targetGender.label}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Actions and Score (จัดใหม่) */}
                    <div className="flex flex-col gap-2 items-center flex-shrink-0 md:w-32">
                        {/* Score Circle (วงกลม) */}
                        <div className="w-16 h-16 rounded-full bg-pink-100 border-2 border-pink-400 flex items-center justify-center font-extrabold text-pink-700 text-lg shadow-md mb-2">
                             {score}%
                        </div>

                        {/* Action Buttons (ปุ่มยาว) */}
                        <button
                            onClick={() => handleSwipe(target, "right")}
                            className="w-full bg-pink-500 text-white py-2 rounded-xl font-semibold shadow-pink-300/50 shadow-md hover:bg-pink-600 transition flex items-center justify-center gap-2"
                        >
                            Like <img src="/images/Likematch.png" className="w-5 h-5 object-contain" alt="Like" />
                        </button>
                        <button
                            onClick={() => handleSwipe(target, "left")}
                            className="w-full bg-gray-300 text-gray-700 py-2 rounded-xl font-semibold shadow-gray-400/50 shadow-md hover:bg-gray-400 transition flex items-center justify-center gap-2"
                        >
                            Nope <img src="/images/dislike.png" className="w-5 h-5 object-contain" alt="Nope" />
                        </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
      </div>
    );
}