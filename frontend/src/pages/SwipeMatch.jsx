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
  // 🧠 Logic การคำนวณคะแนนที่สมเหตุสมผล
  // ---------------------------------------------------------

  // 1. Breed Score (Max 50) - หัวใจหลักของสายพันธุ์
  const getBreedScore = (my, target) => {
    if (!my || !target) return 10;
    if (my === target) return 50; // สายพันธุ์เดียวกันเป๊ะ

    const breedMatch = {
        Persian: ["Ragdoll", "Himalayan", "British Shorthair"],
        Ragdoll: ["Persian", "British Shorthair"],
        Siamese: ["Burmese", "Oriental Shorthair"],
        "British Shorthair": ["Scottish Fold", "Ragdoll"],
    };

    if (breedMatch[my]?.includes(target)) return 30; // กลุ่มพันธุ์ใกล้เคียง
    return 10;
  };

  // 2. Gender Score (Max 20) - บังคับต่างเพศ (สำคัญมากสำหรับการหาคู่)
  const getGenderScore = (my, target) => {
    if (!my || !target) return 0;
    return my !== target ? 20 : 0; // ถ้าเพศเดียวกัน คะแนนส่วนนี้เป็น 0 ทันที
  };

  // 3. Province Score (Max 15) - ความสะดวกในการนัดพบ
  const getProvinceScore = (my, target) => {
    if (!my || !target) return 5;
    return my === target ? 15 : 5;
  };

  // 4. Pedigree Bonus (Max 10) - ความน่าเชื่อถือ/สุขภาพ
  const getPedigreeScore = (target) => {
    return target?.PetdreegreeImage ? 10 : 0;
  };

  // 5. Age Difference Score (Max 5)
  const getAgeScore = (my, target) => {
    if (!my || !target) return 2;
    const diff = Math.abs(my - target);
    if (diff <= 2) return 5;
    if (diff <= 4) return 3;
    return 1;
  };

  const calculateMatchScore = (me, target) => {
    if (!me || !target) return 0;

    let score = 0;
    score += getBreedScore(me.breed, target.breed);    // 50
    score += getGenderScore(me.gender, target.gender); // 20
    score += getProvinceScore(me.province, target.province); // 15
    score += getPedigreeScore(target);                 // 10
    score += getAgeScore(me.age, target.age);          // 5

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
        matchScore: target.matchScore, // ⭐ ส่งคะแนนไปด้วย
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
            <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center p-2 font-semibold text-lg">{imageModal.name}</p>
          </div>
        </div>
      )}

      {/* MATCH MODAL */}
      {matchModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-4 border-pink-300 text-center animate-fadeIn transform scale-105">
            <h2 className="text-4xl font-extrabold text-pink-600 mb-4 drop-shadow-md tracking-wider">🎉 IT'S A MATCH!</h2>
            <p className="text-gray-700 text-lg">You and **{matchModal.cat?.name}** are a pair!</p>
            <div className="flex justify-center my-6">
              <div className="w-24 h-24 rounded-full bg-pink-100 border-4 border-pink-400 flex items-center justify-center font-black text-xl text-pink-700 shadow-inner">
                {matchModal.score}%
              </div>
            </div>
            <img src={matchModal.cat?.image} className="w-full h-48 object-cover rounded-2xl shadow-lg border border-gray-200" alt="Matched" />
            <button onClick={() => setMatchModal({ ...matchModal, open: false })} className="bg-indigo-500 text-white py-3 rounded-xl w-full mt-6 font-semibold shadow-md transition-all hover:bg-indigo-600">Continue Selecting</button>
            <button onClick={handleGoToChat} className="bg-green-500 text-white py-3 rounded-xl w-full mt-3 font-semibold shadow-md transition-all hover:bg-green-600">Start Chatting Now 💬</button>
          </div>
        </div>
      )}

      <h1 className="text-4xl md:text-5xl font-extrabold flex items-center gap-3 text-gray-800 drop-shadow-sm">
        <img src="/images/love.png" className="w-12 h-12" alt="Paw" /> Matching Results
      </h1>

      <div className="text-center bg-white p-4 rounded-xl shadow-lg border border-pink-200 w-full max-w-4xl">
        <p className="text-xl font-semibold text-gray-700 mb-1">
          Your Cat: <span className="text-pink-600 font-extrabold">{myCat.name}</span>
        </p>
        <p className="text-sm text-gray-500 italic text-center">
          Filtering for: {criteria.breed} / {criteria.color} / {criteria.age} / {criteria.gender} / **{criteria.province}**
        </p>
      </div>

      {/* TARGET LIST */}
      <div className="w-full max-w-4xl space-y-6 pb-12">
        {targets.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-3xl shadow-xl mt-10 border border-gray-300">
            <h2 className="text-2xl text-gray-700 font-semibold mb-3">No potential matches found 😿</h2>
            <button onClick={() => navigate("/matching")} className="text-pink-500 font-bold hover:underline">Change Criteria</button>
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
                    
                    {/* Grid แสดงข้อมูลจัดเรียงตามที่ต้องการ */}
                    <div className="text-sm text-gray-700 grid grid-cols-2 gap-x-4 gap-y-1">
                      {/* แถว 1: Breed & Age */}
                      <p><strong>Breed:</strong> {target.breed || "—"}</p>
                      <p><strong>Age:</strong> {target.age ? `${target.age} yrs` : "—"}</p>
                      
                      {/* แถว 2: Color & Petdreegree */}
                      <p><strong>Color:</strong> {target.color || "—"}</p>
                      <p className="flex items-center gap-1">
                        <strong>Petdreegree:</strong>
                        {target.PetdreegreeImage ? (
                          <span className="text-green-600 font-bold flex items-center gap-1">
                            Yes 
                          </span>
                        ) : (
                          <span className="text-red-500 font-bold">No</span>
                        )}
                      </p>

                      {/* แถว 3: Address & Gender */}
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
                    <div className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center font-extrabold text-lg shadow-sm ${score >= 80 ? 'bg-green-50 border-green-300 text-green-600' : score >= 50 ? 'bg-yellow-50 border-yellow-300 text-yellow-600' : 'bg-pink-50 border-pink-300 text-pink-600'}`}>
                      {score}%
                    </div>
                    <span className="text-gray-600 text-sm font-semibold">Match Score</span>
                  </div>
                  <div className="flex gap-3 flex-1 md:flex-none">
                    <button onClick={() => handleSwipe(target, "right")} className="flex-1 bg-pink-500 text-white px-5 py-2 rounded-xl font-bold shadow-md hover:bg-pink-600 transition flex items-center justify-center gap-2 active:scale-95">
                      Like <img src="/images/Likematch.png" className="w-5 h-5 object-contain" alt="Like" />
                    </button>
                    <button onClick={() => handleSwipe(target, "left")} className="flex-1 bg-gray-300 text-gray-700 px-5 py-2 rounded-xl font-bold shadow-md hover:bg-gray-400 transition flex items-center justify-center gap-2 active:scale-95">
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