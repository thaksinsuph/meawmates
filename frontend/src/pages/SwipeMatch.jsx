import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function SwipeMatch() { 
  const navigate = useNavigate();

  // ⭐ NEW STATE: ข้อมูลที่โหลดมาจาก Local Storage (แมวเรา + เงื่อนไข)
  const [matchingData, setMatchingData] = useState(null);
  
  // โหลดแมวเป้าหมายทั้งหมดที่เข้าข่ายเงื่อนไข
  const [targets, setTargets] = useState([]); 
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------
  // Compatibility Engine (ใช้สำหรับคำนวณ Match Score)
  // ---------------------------------------------------------

  // Note: ฟังก์ชันเหล่านี้ต้องมีอยู่จริงในไฟล์นี้ หรือ import มา
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
    // สมมติว่า my และ target เป็นตัวเลข (age: 1, 2, 3...)
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
        return { img: "/images/female_icon.png", color: "text-pink-500", label: "Female" };
    }
    return { img: "/images/unknown.png", color: "text-gray-500", label: "Unknown" };
  };

  // ---------------------------------------------------------

  /* ---------------------------------------------------------
  // ⭐ Load Data and Filter Targets
  // --------------------------------------------------------- */
  const loadTargetCats = async (criteria) => {
    setLoading(true);
    try {
      // 💡 ส่งเงื่อนไขการค้นหาไปให้ Backend API
      // ในการใช้งานจริง, API จะต้องกรองข้อมูลตาม criteria.breed, criteria.color, ฯลฯ
      const res = await api.get("/api/matching/filtered-cats", { 
        params: criteria // ส่ง { breed: "Any", color: "White", ... }
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
    
    // โหลดแมวเป้าหมายตามเงื่อนไขที่ได้มา
    loadTargetCats(data.criteria); 

  }, []);

  /* ---------------------------------------------------------
  // 💡 Handle Like/Dislike (สำหรับ List View)
  // --------------------------------------------------------- */
  const handleSwipe = async (target, direction) => {
    if (!matchingData?.pet || !target) return;

    // ลบแมวตัวนี้ออกจาก List ทันทีเพื่ออัปเดต UI
    setTargets(prev => prev.filter(c => c._id !== target._id));

    try {
      const res = await api.post("/api/matching/swipe", {
        myCatSlot: matchingData.pet.slot,
        targetCatId: target._id,
        liked: direction === "right",
      });

      if (res.data.match) {
        alert(`🎉 It's a Meow Match with ${target.name}! Check your messages.`);
      }
    } catch (err) {
      console.error("Swipe error:", err);
    }
  };


  if (loading) 
    return <div className="py-40 text-center text-pink-500 text-2xl font-semibold">Loading potential matches...</div>;
  
  if (!matchingData)
    return <div className="py-40 text-center text-red-500 text-xl">Error: No selected cat data.</div>;
  
  const myCat = matchingData.pet;
  const criteria = matchingData.criteria;

  /* ============================================================
    UI: LIST VIEW (แทนที่ UI เดิมที่เป็น Swipe)
  ============================================================ */

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-10 px-4 gap-8 
          bg-gradient-to-b from-pink-50 to-purple-50">

      {/* 1. TITLE / CRITERIA SUMMARY */}
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

            return (
              <div 
                key={target._id} 
                className="bg-white rounded-3xl shadow-xl p-5 flex flex-col md:flex-row gap-5 items-center 
                          hover:shadow-2xl transition-shadow border-t-4 border-pink-500/50"
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
                        {/* Gender Badge */}
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
                                    hover:bg-pink-600 transition"
                    >
                        Like ❤️
                    </button>
                    <button
                        onClick={() => handleSwipe(target, "left")}
                        className="flex-1 bg-gray-300 text-gray-700 px-5 py-2 rounded-xl font-semibold shadow-md 
                                    hover:bg-gray-400 transition"
                    >
                        Nope ❌
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