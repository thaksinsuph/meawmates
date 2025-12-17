import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function SwipeMatch() {
  const navigate = useNavigate();

  const [matchingData, setMatchingData] = useState(null);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⭐ State สำหรับ Match Modal
  const [matchModal, setMatchModal] = useState({
    open: false,
    cat: null,
    score: 0,
    ownerId: null,
  });

  // ⭐ State สำหรับ Animation
  const [animatedTargets, setAnimatedTargets] = useState({});

  // ⭐ State สำหรับ Image View Modal
  const [imageModal, setImageModal] = useState({
    open: false,
    image: null,
    name: null,
  });

  // ---------------------------------------------------------
  // Compatibility Engine & Utility Functions
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
    if (my === target) return 50; 
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
    if ((my === "energetic" && target === "chill") || (my === "chill" && target === "energetic"))
      return 6;
    return 14;
  };

  const getGenderScore = (my, target) => {
    if (!my || !target) return 5;
    if (my === target) return 0; // เพศเดียวกันได้ 0
    if (my !== target) return 25; // เพศตรงข้าม
    return 5;
  };

  const getNameVibe = (my, target) => {
    if (!my || !target) return 0;
    return my[0].toLowerCase() === target[0].toLowerCase() ? 5 : 0;
  };

  const getProvinceScore = (my, target) => {
    if (!my || !target) return 5;
    if (my === target) return 15;
    return 5;
  };

  // ⭐ NEW Logic: เพิ่มคะแนนถ้าทั้งคู่มีใบเพ็ด
  const getPedigreeScore = (my, target) => {
    if (my?.PetdreegreeImage && target?.PetdreegreeImage) return 10;
    return 0;
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
    score += getProvinceScore(me.province, target.province);
    score += getPedigreeScore(me, target);

    return Math.min(100, Math.max(0, Math.round(score)));
  };

  const getGenderImage = (gender) => {
    if (gender === "Male") return { img: "/images/male.png", color: "text-blue-500", label: "Male" };
    if (gender === "Female") return { img: "/images/female.png", color: "text-pink-500", label: "Female" };
    return { img: "/images/unknown.png", color: "text-gray-500", label: "Unknown" };
  };

  // ---------------------------------------------------------
  // ⭐ Load Data & Sort Score
  // ---------------------------------------------------------
  const loadTargetCats = async (criteria, myCat) => {
    setLoading(true);
    try {
      const res = await api.get("/api/matching/filtered-cats", {
        params: criteria,
      });

      const sortedData = res.data
        .map((cat) => ({
          ...cat,
          matchScore: calculateMatchScore(myCat, cat),
        }))
        .sort((a, b) => b.matchScore - a.matchScore);

      setTargets(sortedData);
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
    loadTargetCats(data.criteria, data.pet);
  }, []);

  const handleSwipe = async (target, direction) => {
    if (!matchingData?.pet || !target) return;
    const targetId = target._id;
    const score = target.matchScore;
    const animationDirection = direction === "right" ? "right" : "left";
    setAnimatedTargets((prev) => ({ ...prev, [targetId]: animationDirection }));

    try {
      const res = await api.post("/api/matching/swipe", {
        myCatSlot: matchingData.pet.slot,
        targetCatId: targetId,
        liked: direction === "right",
      });

      if (res.data.match) {
        setMatchModal({ open: true, cat: target, score: score, ownerId: res.data.ownerId });
      }
    } catch (err) {
      console.error("Swipe error:", err);
    }

    setTimeout(() => {
      setTargets((prev) => prev.filter((c) => c._id !== targetId));
      setAnimatedTargets((prev) => {
        const newTargets = { ...prev };
        delete newTargets[targetId];
        return newTargets;
      });
    }, 300);
  };

  const handleOpenImage = (target) => setImageModal({ open: true, image: target.image, name: target.name });
  const handleCloseImage = () => setImageModal({ open: false, image: null, name: null });
  const handleGoToChat = () => {
    const ownerId = matchModal.ownerId;
    setMatchModal({ open: false, cat: null, score: 0, ownerId: null });
    navigate(`/messages/${ownerId}`);
  };

  if (loading) return <div className="py-40 text-center text-pink-500 text-2xl font-semibold">Loading potential matches...</div>;
  if (!matchingData) return <div className="py-40 text-center text-red-500 text-xl">Error: No selected cat data.</div>;

  const myCat = matchingData.pet;
  const criteria = matchingData.criteria;

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-10 px-4 gap-8 bg-gradient-to-b from-pink-50 to-purple-50">
      
      {/* IMAGE VIEW MODAL */}
      {imageModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 cursor-pointer" onClick={handleCloseImage}>
          <div className="max-w-xl max-h-[90vh] w-full bg-white rounded-3xl overflow-hidden shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <img src={imageModal.image} className="w-full h-full object-contain" alt={imageModal.name} />
            <button onClick={handleCloseImage} className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black transition text-lg font-bold">&times;</button>
          </div>
        </div>
      )}

      {/* MATCH MODAL */}
      {matchModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-4 border-pink-300 text-center animate-fadeIn transform scale-105">
            <h2 className="text-4xl font-extrabold text-pink-600 mb-4 drop-shadow-md tracking-wider"> IT'S A MATCH!</h2>
            <p className="text-gray-700 text-lg">You and **{matchModal.cat?.name}** are a pair!</p>
            <div className="flex justify-center my-6">
              <div className="w-24 h-24 rounded-full bg-pink-100 border-4 border-pink-400 flex items-center justify-center font-black text-xl text-pink-700">
                {matchModal.score}%
              </div>
            </div>
            <img src={matchModal.cat?.image} className="w-full h-48 object-cover rounded-2xl shadow-lg border border-gray-200" alt="Matched" />
            <button onClick={() => setMatchModal({ ...matchModal, open: false })} className="bg-indigo-500 text-white py-3 rounded-xl w-full mt-6 font-semibold shadow-md">Continue Selecting</button>
            <button onClick={handleGoToChat} className="bg-green-500 text-white py-3 rounded-xl w-full mt-3 font-semibold shadow-md">Start Chatting Now 💬</button>
          </div>
        </div>
      )}

      <h1 className="text-4xl md:text-5xl font-extrabold flex items-center gap-3 text-gray-800 drop-shadow-sm">
        <img src="/images/love.png" className="w-12 h-12" alt="Paw" /> Matching Results
      </h1>

      {/* TARGET LIST */}
      <div className="w-full max-w-4xl space-y-6 pb-12">
        {targets.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-3xl shadow-xl mt-10 border border-gray-300">
            <h2 className="text-2xl text-gray-700 font-semibold mb-3">No potential matches found 😿</h2>
          </div>
        ) : (
          targets.map((target) => {
            const score = target.matchScore;
            const targetGender = getGenderImage(target.gender);
            const animation = animatedTargets[target._id];
            const animationClasses = animation === "right" ? "translate-x-[150%] opacity-0 rotate-6 scale-95" : animation === "left" ? "translate-x-[-150%] opacity-0 rotate-[-6deg] scale-95" : "";

            return (
              <div key={target._id} className={`bg-white shadow-xl border-t-8 border-pink-500/80 p-6 rounded-2xl relative overflow-hidden transition-all duration-300 ${animationClasses}`}>
                <div className="flex items-start gap-6">
                  <img src={target.image} className="w-28 h-28 rounded-xl object-cover shadow-lg border-2 border-pink-100 cursor-pointer hover:opacity-80 transition" alt={target.name} onClick={() => handleOpenImage(target)} />
                  <div className="flex-1 flex flex-col justify-start gap-2">
                    <h2 className="font-extrabold text-2xl text-gray-800">{target.name}</h2>
                    
                    {/* Grid แสดงข้อมูล */}
                    <div className="text-sm text-gray-700 grid grid-cols-2 gap-x-4 gap-y-1">
                      {/* แถว 1 */}
                      <p><strong>Breed:</strong> {target.breed || "—"}</p>
                      <p><strong>Age:</strong> {target.age ? `${target.age} yrs` : "—"}</p>
                      
                      {/* แถว 2 */}
                      <p><strong>Color:</strong> {target.color || "—"}</p>
                      <p className="flex items-center gap-1">
                        <strong>Petdreegree:</strong>
                        {target.PetdreegreeImage ? (
                          <span className="text-green-600 font-bold flex items-center gap-1">
                            Yes <img src="/images/verify.png" className="w-3 h-3" alt="verified" />
                          </span>
                        ) : (
                          <span className="text-red-500 font-bold">No</span>
                        )}
                      </p>

                      {/* แถว 3 */}
                      <p className="flex items-center gap-1">
                        <img src="/images/location.png" className="w-4 h-4" alt="Location" />
                        <strong>Adress:</strong> {target.province || "—"}
                      </p>
                      <p className="flex items-center gap-1">
                        <strong>Gender:</strong>
                        {targetGender.img && <img src={targetGender.img} className="w-4 h-4 ml-1" alt="Icon" />}
                        <span className={`font-semibold ${targetGender.color}`}>{targetGender.label}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-pink-50 border-2 border-pink-300 flex flex-col items-center justify-center font-extrabold text-pink-600 text-lg shadow-sm">
                      {score}%
                    </div>
                    <span className="text-gray-600 text-sm font-semibold">Match Score</span>
                  </div>
                  <div className="flex gap-3 flex-1 md:flex-none">
                    <button onClick={() => handleSwipe(target, "right")} className="flex-1 bg-pink-500 text-white px-5 py-2 rounded-xl font-bold shadow-md hover:bg-pink-600 transition flex items-center justify-center gap-2">
                      Like <img src="/images/Likematch.png" className="w-5 h-5 object-contain" alt="Like" />
                    </button>
                    <button onClick={() => handleSwipe(target, "left")} className="flex-1 bg-gray-300 text-gray-700 px-5 py-2 rounded-xl font-bold shadow-md hover:bg-gray-400 transition flex items-center justify-center gap-2">
                      Nope <img src="/images/dislike.png" className="w-5 h-5 object-contain" alt="Nope" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}