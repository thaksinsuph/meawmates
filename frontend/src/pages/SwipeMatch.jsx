import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

export default function SwipeMatch() {
  const navigate = useNavigate();

  const [myCat, setMyCat] = useState(null);
  const [targets, setTargets] = useState([]);
  const [index, setIndex] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);

  const [matchModal, setMatchModal] = useState({
    open: false,
    cat: null,
    score: 0,
    ownerId: null,   
  });

  // ---------------------------------------------------------
  // Compatibility Engine (Logic เดิม)
  // ---------------------------------------------------------

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

    // ⭐ เพิ่มคะแนน GENDER ที่นี่
    score += getGenderScore(me.gender, target.gender); 

    return Math.min(100, Math.max(0, Math.round(score)));
  };
  
  // ---------------------------------------------------------
  // ⭐ NEW/EDITED: Gender Icon/Image Logic
  // ---------------------------------------------------------
  const getGenderImage = (gender) => {
    if (gender === "Male") {
        return { img: "/images/male.png", color: "text-blue-500", label: "Male" };
    }
    if (gender === "Female") {
        return { img: "/images/female_icon.png", color: "text-pink-500", label: "Female" };
    }
    
  };

  // ---------------------------------------------------------
  // Load Data (unchanged)
  // ---------------------------------------------------------

  useEffect(() => {
    const selected = JSON.parse(localStorage.getItem("selectedPet"));

    if (!selected?.slot) {
      navigate("/matching");
      return;
    }

    loadMyCat(selected.slot);
    loadTargetCats();
  }, []);

  const loadMyCat = async (slot) => {
    try {
      const res = await api.get(`/api/pets/${slot}`);
      setMyCat(res.data);
    } catch (err) {
      console.error("Load my cat error:", err);
    }
  };

  const loadTargetCats = async () => {
    try {
      const res = await api.get("/api/matching/cats");
      setTargets(res.data);
    } catch (err) {
      console.error("Load target cats error:", err);
    }
  };

  // ---------------------------------------------------------
  // Swipe (unchanged)
  // ---------------------------------------------------------

  const handleSwipe = async (direction) => {
    if (!myCat || !targets[index]) return;

    const target = targets[index];
    const score = calculateMatchScore(myCat, target);

    if (direction === "right") setIsLiking(true);
    else setIsDisliking(true);

    try {
      const res = await api.post("/api/matching/swipe", {
        myCatSlot: myCat.slot,
        targetCatId: target._id,
        liked: direction === "right",
      });

      if (res.data.match) {
        setMatchModal({
          open: true,
          cat: target,
          score,
          ownerId: res.data.ownerId, 
        });
      }
    } catch (err) {
      console.error("Swipe error:", err);
    }

    setTargets((prev) => prev.filter((c) => c._id !== target._id));
    setIndex(0);

    setTimeout(() => {
      setIsLiking(false);
      setIsDisliking(false);
    }, 250);
  };

  const currentTarget = targets[index];
  const targetGender = currentTarget ? getGenderImage(currentTarget.gender) : null;


  // ---------------------------------------------------------
  // UI (ปรับปรุงการแสดงผล Gender)
  // ---------------------------------------------------------

  return (
  <div className="min-h-screen w-full flex flex-col items-center 
      py-10 px-4 gap-10 
      bg-gradient-to-b from-pink-50 to-purple-50">

    {/* TITLE */}
    <h1 className="text-4xl md:text-5xl font-extrabold flex items-center gap-3 text-gray-800 drop-shadow-sm">
      <img src="/images/love.png" className="w-12 h-12" />
      Find Your Perfect Cat Match
    </h1>

    {/* TARGET CAT CARD */}
    {currentTarget ? (
      <div
        className={`relative backdrop-blur-xl bg-white/70 p-6 
        rounded-3xl shadow-2xl border border-white/30
        w-full max-w-xs md:max-w-md aspect-[3/4]
        transition-all duration-300 ease-out 
        hover:shadow-pink-200 hover:-translate-y-1
        ${isLiking ? "translate-x-6 rotate-3 scale-[1.03]" : ""}
        ${isDisliking ? "-translate-x-6 -rotate-3 scale-[1.03]" : ""}`}
      >

        {/* ⭐ SCORE MATCH + GENDER BADGE (ด้านบน) ⭐ */}
        <div className="absolute top-4 left-4 flex gap-3 z-10">
          
          {/* Match Score */}
          <div className="flex items-center gap-1 
            bg-pink-100/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md border border-pink-200">
            <span className="font-semibold text-gray-700 text-sm">
              Match:
          </span>
            <span className="font-extrabold text-pink-600 text-lg">
              {calculateMatchScore(myCat, currentTarget)}%
          </span>
          </div>

          {/* Gender Image */}
          {targetGender && (
            <div className={`flex items-center gap-1 bg-white/90 px-3 py-1 rounded-full shadow-md border 
              ${targetGender.color.replace('text-', 'border-')}`}>
              {/* 💡 ใช้แท็ก <img> แทน <span> */}
              <img src={targetGender.img} className="w-5 h-5 object-contain" alt={targetGender.label} />
              <span className="text-sm font-medium text-gray-700">{targetGender.label}</span>
            </div>
          )}
        </div>


        {/* LIKE / NOPE Indicators (unchanged) */}
        {isLiking && (
          <img src="/images/Likematch.png" className="absolute top-6 left-4 w-32 opacity-90 rotate-[-15deg]" />
        )}

        {isDisliking && (
          <img src="/images/dislike.png" className="absolute top-6 right-4 w-32 opacity-90 rotate-[15deg]" />
        )}

        {/* CAT IMAGE */}
        <img
          src={currentTarget.image}
          className="w-full aspect-square object-cover rounded-2xl shadow-lg border border-gray-100"
        />

        {/* CAT INFO */}
        <div className="mt-4 text-center">
          <p className="text-3xl font-bold text-gray-800 drop-shadow-sm">
            {currentTarget.name}
          </p>
          
          {/* รายละเอียดเพิ่มเติมที่จัดเรียงใหม่ */}
          <div className="text-gray-600 text-sm mt-1 flex justify-center gap-3 font-medium">
            <span>{currentTarget.breed}</span>
            <span>•</span>
            <span>{currentTarget.age} yrs</span>
            <span>•</span>
            <span>{currentTarget.color}</span>
          </div>
        </div>

        {/* ACTION BUTTONS (unchanged) */}
        <div className="flex gap-10 mt-6 justify-center">

          {/* DISLIKE */}
          <button
            onClick={() => handleSwipe("left")}
            className="w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm 
              hover:bg-red-100 border border-gray-300 flex items-center justify-center 
              shadow-lg transition-all"
          >
            <img src="/images/dislike.png" className="w-12 h-12 object-contain" />
          </button>

          {/* LIKE */}
          <button
            onClick={() => handleSwipe("right")}
            className="w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm 
              hover:bg-blue-100 border border-gray-300 flex items-center justify-center 
              shadow-lg transition-all"
          >
            <img src="/images/Likematch.png" className="w-12 h-12 object-contain" />
          </button>


        </div>

      </div>
    ) : (
      <div className="text-center mt-10">
        <h2 className="text-2xl text-gray-700 font-semibold mb-3">
          No more cats to show 😿
        </h2>
        <button
          onClick={() => navigate("/matching")}
          className="bg-pink-500 text-white px-6 py-3 rounded-2xl shadow-md 
            hover:bg-pink-600 hover:shadow-pink-300 transition"
        >
          Choose Another Cat
        </button>
      </div>
    )}

    {/* MATCH MODAL (unchanged) */}
    {matchModal.open && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
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
          />

          <p className="text-xl font-semibold mb-1">
            {matchModal.cat?.name}
          </p>

          {/* Continue */}
          <button
            onClick={() => setMatchModal({ open: false })}
            className="bg-pink-500 text-white py-3 rounded-xl w-full mt-4 shadow-md hover:bg-pink-600"
          >
            Continue Swiping
          </button>

          {/* Chat */}
          <button
            onClick={() => navigate(`/messages/${matchModal.ownerId}`)}
            className="bg-indigo-500 text-white py-3 rounded-xl w-full mt-3 shadow-md hover:bg-indigo-600"
          >
            Go to Chat 💬
          </button>

        </div>
      </div>
    )}

  </div>
);
}