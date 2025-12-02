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
    ownerId: null,   // ⭐ เพิ่มเก็บ owner
  });

  // ---------------------------------------------------------
  // Compatibility Engine (เดิม)
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

    return Math.min(100, Math.max(0, Math.round(score)));
  };

  // ---------------------------------------------------------
  // Load Data
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
  // Swipe
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
          ownerId: res.data.ownerId, // ⭐ รับ ownerId จาก backend
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

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="w-full flex flex-col items-center py-10 px-4 gap-8">

      <h1 className="text-4xl font-bold flex items-center gap-3">
        <img src="/images/love.png" className="w-10 h-10" />
        Cat Matching 
      </h1>

      {currentTarget ? (
        <div
          className={`relative bg-white p-4 rounded-3xl shadow-xl 
          w-full max-w-sm md:max-w-md aspect-[3/4] 
          text-center transition-transform duration-200
            ${isLiking ? "translate-x-6 rotate-2" : ""}
            ${isDisliking ? "-translate-x-6 -rotate-2" : ""}
          `}
        >
          <div className="absolute top-3 right-3 bg-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold">
            {calculateMatchScore(myCat, currentTarget)}% match
          </div>

          {isLiking && (
            <div className="absolute top-6 left-4 border-4 border-green-400 text-green-500 font-extrabold text-2xl px-3 py-1 rounded-lg rotate-[-15deg]">
              LIKE
            </div>
          )}
          {isDisliking && (
            <div className="absolute top-6 right-4 border-4 border-red-400 text-red-500 font-extrabold text-2xl px-3 py-1 rounded-lg rotate-[15deg]">
              NOPE
            </div>
          )}

          <img
            src={currentTarget.image}
            className="w-full aspect-[5/5] object-cover rounded-2xl mb-4"
          />

          <p className="text-2xl font-bold mb-1">{currentTarget.name}</p>
          <p className="text-sm text-gray-600 mb-4">
            {currentTarget.breed} • {currentTarget.color} • {currentTarget.age} yrs
          </p>

          <div className="flex gap-6 mt-4 justify-center">
            <button
              onClick={() => handleSwipe("left")}
              className="w-16 h-16 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-2xl shadow-md"
            >
              ❌
            </button>

            <button
              onClick={() => handleSwipe("right")}
              className="w-16 h-16 rounded-full bg-pink-500 hover:bg-pink-600 flex items-center justify-center text-2xl text-white shadow-md"
            >
              ❤️
            </button>
          </div>

        </div>
      ) : (
        <div className="text-center mt-10">
          <h2 className="text-xl text-gray-700 mb-4">No more cats to show!</h2>
          <button
            onClick={() => navigate("/matching")}
            className="bg-pink-500 text-white px-6 py-3 rounded-xl"
          >
            Back to select another cat
          </button>
        </div>
      )}

      {/* ------------------ MATCH MODAL ------------------ */}
      {matchModal.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
            
            <h2 className="text-3xl font-extrabold text-pink-500 mb-2">
              It’s a Meow Match!
            </h2>

            <p className="text-gray-700 mb-4">
              Compatibility score: <span className="font-bold">{matchModal.score}%</span>
            </p>

            <img
              src={matchModal.cat?.image}
              className="w-full h-64 object-cover rounded-2xl mb-4"
            />

            <p className="text-lg font-semibold mb-1">{matchModal.cat?.name}</p>

            {/* Continue Swiping */}
            <button
              onClick={() => setMatchModal({ open: false, cat: null, score: 0 })}
              className="bg-pink-500 text-white py-2 rounded-xl w-full mb-3"
            >
              Continue swiping
            </button>

            {/* ⭐ NEW: Go To Chat */}
            <button
              onClick={() =>
                navigate(`/messages/${matchModal.ownerId}`)
              }
              className="bg-indigo-500 text-white py-2 rounded-xl w-full"
            >
              Go to Chat 💬
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
