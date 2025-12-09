import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function SwipeMatch() { 
    const navigate = useNavigate();

    const [matchingData, setMatchingData] = useState(null);
    const [targets, setTargets] = useState([]); 
    const [loading, setLoading] = useState(true);

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
    // Compatibility Engine (ใช้สำหรับคำนวณ Match Score)
    // ... (โค้ดฟังก์ชันทั้งหมด เช่น getColorGroup, getBreedScore, calculateMatchScore, getGenderImage) ...
    
    // (ใส่ฟังก์ชันทั้งหมดจากโค้ดเดิมของคุณที่นี่ เพื่อให้โค้ดสมบูรณ์)
    const colorGroups = {
        warm: ["orange", "cream", "brown", "ginger", "gold", "tan"],
        cool: ["gray", "black", "blue", "silver"],
        neutral: ["white"],
        mixed: ["calico", "tabby"],
    };

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
        if (gender === "Male") {
            return { img: "/images/male.png", color: "text-blue-500", label: "Male" };
        }
        if (gender === "Female") {
            return { img: "/images/female.png", color: "text-pink-500", label: "Female" }; 
        }
        return { img: "/images/unknown.png", color: "text-gray-500", label: "Unknown" };
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
        // (ไม่ต้องทำอะไรเพิ่ม เพราะ Item ที่ Match ถูกลบออกไปแล้วใน handleSwipe)
    };


    /* ============================================================
      UI: LIST VIEW + MATCH MODAL
    ============================================================ */

    return (
      <div className="min-h-screen w-full flex flex-col items-center py-10 px-4 gap-8 
            bg-gradient-to-b from-pink-50 to-purple-50">
        
        {/* ⭐ MATCH MODAL UI */}
        {matchModal.open && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-white/30 text-center animate-fadeIn">

                    <h2 className="text-4xl font-extrabold text-pink-500 mb-2 drop-shadow-sm">
                        🎉 It's a Meow Match!
                    </h2>

                    <p className="text-gray-700 mb-4 text-lg">
                        Your score: <span className="font-bold">{matchModal.score}%</span>
                    </p>

                    <img
                        src={matchModal.cat?.image}
                        className="w-full h-64 object-cover rounded-2xl shadow-lg mb-4"
                        alt={matchModal.cat?.name || 'Matched Cat'}
                    />

                    <p className="text-xl font-semibold mb-1">
                        {matchModal.cat?.name}
                    </p>

                    {/* Continue Pairing */}
                    <button
                        onClick={handleContinueMatching}
                        className="bg-pink-500 text-white py-3 rounded-xl w-full mt-4 shadow-md hover:bg-pink-600 transition"
                    >
                        Continue Selecting
                    </button>

                    {/* Go to Chat */}
                    <button
                        onClick={handleGoToChat}
                        className="bg-indigo-500 text-white py-3 rounded-xl w-full mt-3 shadow-md hover:bg-indigo-600 transition"
                    >
                        Go to Chat 💬
                    </button>

                </div>
            </div>
        )}
        {/* ⭐ END MATCH MODAL UI */}

        {/* 1. TITLE / CRITERIA SUMMARY (โค้ดเดิม) */}
        {/* ... (โค้ด Title และ Criteria Summary) ... */}
        <h1 className="text-4xl md:text-5xl font-extrabold flex items-center gap-3 text-gray-800 drop-shadow-sm">
          <img src="/images/paw-decor.png" className="w-12 h-12" alt="Paw" />
          Petdreegree Results
        </h1>
        
        <div className="text-center bg-white p-4 rounded-xl shadow-md border border-pink-100 w-full max-w-4xl">
          <p className="text-xl font-semibold text-gray-700 mb-1">
              Your Cat: <span className="text-pink-600">{myCat.name}</span>
          </p>
          <p className="text-sm text-gray-500">
              **Criteria:** Breed: {criteria.breed}, Color: {criteria.color}, Age: {criteria.age}, Gender: {criteria.gender}
          </p>
          <button
            onClick={() => navigate("/matching")}
            className="text-pink-500 text-sm font-semibold hover:underline mt-2"
          >
            (Change Criteria / Cat)
          </button>
        </div>


        {/* 2. TARGET CAT LIST */}
        <div className="w-full max-w-4xl space-y-6 pb-12">
          {targets.length === 0 ? (
            <div className="text-center bg-white p-12 rounded-3xl shadow-xl mt-10">
              <h2 className="text-2xl text-gray-700 font-semibold mb-3">
                No cats match your Petdreegree criteria 😿
              </h2>
            </div>
          ) : (
            targets.map((target) => {
              const score = calculateMatchScore(myCat, target);
              const targetGender = getGenderImage(target.gender);
              
              // ⭐ Animation Classes (จากคำถามที่แล้ว)
              const animation = animatedTargets[target._id];
              const animationClasses = animation === 'right' 
                  ? 'translate-x-[150%] opacity-0 rotate-6 scale-90' // Like: เด้งไปขวา
                  : animation === 'left'
                  ? 'translate-x-[-150%] opacity-0 rotate-[-6deg] scale-90' // Nope: เด้งไปซ้าย
                  : ''; // Normal

              return (
                <div 
                  key={target._id} 
                  className={`
                        bg-white rounded-3xl shadow-xl p-5 flex flex-col md:flex-row gap-5 items-center 
                        hover:shadow-2xl border-t-4 border-pink-500/50
                        
                        // ⭐ เพิ่ม Transition และ Animation Classes
                        transition-all duration-300 ease-in-out 
                        ${animationClasses}
                      `}
                >
                  {/* Image */}
                  <div className="flex-shrink-0 w-full md:w-32 h-32 overflow-hidden rounded-xl shadow-inner">
                      <img 
                          src={target.image} 
                          alt={target.name} 
                          className="w-full h-full object-cover"
                      />
                  </div>

                  {/* Info */}
                  <div className="flex-grow text-center md:text-left">
                      <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                          <h3 className="text-2xl font-bold text-gray-800">
                              {target.name}
                          </h3>
                          {/* Gender Badge (ใช้รูปภาพ) */}
                          <div className={`flex items-center text-sm font-medium ${targetGender.color}`}>
                              <img src={targetGender.img} className="w-4 h-4 mr-1" alt={targetGender.label} />
                              {targetGender.label}
                          </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2">
                          {target.breed} • {target.age} yrs • {target.color}
                      </p>

                      {/* Match Score */}
                      <div className="flex items-center gap-2 bg-pink-50 px-3 py-1 rounded-full w-fit mx-auto md:mx-0">
                          <span className="font-semibold text-gray-700 text-sm">Match Score:</span>
                          <span className="font-extrabold text-pink-600 text-lg">{score}%</span>
                      </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 flex-shrink-0 w-full md:w-auto">
                      <button
                          onClick={() => handleSwipe(target, "right")}
                          className="flex-1 bg-pink-500 text-white px-5 py-2 rounded-xl font-semibold shadow-md 
                                      hover:bg-pink-600 transition flex items-center justify-center gap-2"
                      >
                          Like <img src="/images/Like.png" className="w-5 h-5 object-contain" alt="Like" />
                      </button>
                      <button
                          onClick={() => handleSwipe(target, "left")}
                          className="flex-1 bg-gray-300 text-gray-700 px-5 py-2 rounded-xl font-semibold shadow-md 
                                      hover:bg-gray-400 transition flex items-center justify-center gap-2"
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