import { useEffect, useState } from "react";
import api from "../api";

// ⭐ 1. ฟังก์ชันสำหรับดึงข้อมูลรูปภาพเพศ
const getGenderImage = (gender) => {
    if (gender === "Male") {
        return { 
            img: "/images/male.png", 
            color: "text-blue-600", 
            label: "Male" 
        };
    }
    if (gender === "Female") {
        return { 
            img: "/images/female.png", 
            color: "text-pink-600", 
            label: "Female" 
        };
    }
    return null;
};

export default function MatchHistory() {
    const [history, setHistory] = useState([]);

    // ⭐ STATE: สำหรับ Image View Modal
    const [imageModal, setImageModal] = useState({
        open: false,
        image: null,
        name: null,
    });

    const loadHistory = async () => {
        try {
            const res = await api.get("/api/matching/history");
            setHistory(res.data || []);
        } catch (err) {
            console.error("Load history error:", err);
        }
    };
    
    const handleOpenImage = (cat) => {
        setImageModal({
            open: true,
            image: cat.image,
            name: cat.name,
        });
    };

    const handleCloseImage = () => {
        setImageModal({ open: false, image: null, name: null });
    };

    useEffect(() => {
        loadHistory();
    }, []);

    return (
        <div className="max-w-3xl mx-auto py-10 px-4 min-h-screen">
            
            {/* ⭐ IMAGE VIEW MODAL UI */}
            {imageModal.open && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 cursor-pointer"
                    onClick={handleCloseImage}
                >
                    <div 
                        className="max-w-xl max-h-[90vh] w-full bg-white rounded-3xl overflow-hidden shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={imageModal.image}
                            className="w-full h-full object-contain"
                            alt={imageModal.name || 'Cat Image'}
                        />
                        <button 
                            onClick={handleCloseImage}
                            className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black transition text-lg font-bold"
                        >
                            &times;
                        </button>
                        <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center p-2 font-semibold text-lg">
                            {imageModal.name}
                        </p>
                    </div>
                </div>
            )}

            <h1 className="text-3xl font-bold mb-8 text-pink-600 flex items-center gap-3">
                <img src="/images/history.png" className="w-8 h-8" alt="History Icon" />
                Swipe History
            </h1>

            <div className="space-y-4">
                {history.map((h) => {
                    const targetCat = h.targetCat;
                    if (!targetCat) return null;

                    const genderData = getGenderImage(targetCat.gender);
                    const score = h.matchScore || 0; // ดึงคะแนนจาก Backend

                    return (
                        <div
                            key={h._id}
                            className="flex items-center gap-4 bg-white shadow-lg border-l-8 p-5 rounded-2xl hover:shadow-xl transition-all"
                            style={{ borderColor: h.liked ? '#EC4899' : '#9CA3AF' }}
                        >
                            {/* 1. วงกลมเปอร์เซ็นต์ (Score Circle) - แสดงเฉพาะเมื่อ Liked */}
                            <div className="flex-shrink-0 flex flex-col items-center gap-1">
                                <div className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center font-extrabold text-lg shadow-sm
                                    ${score >= 80 ? 'bg-green-50 border-green-300 text-green-600' : 
                                      score >= 50 ? 'bg-yellow-50 border-yellow-300 text-yellow-600' : 
                                      'bg-pink-50 border-pink-300 text-pink-600'}`}
                                >
                                    <span className="text-base leading-none">{score}%</span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Match</span>
                            </div>

                            {/* 2. รูปแมว - คลิกดูรูปใหญ่ */}
                            <img
                                src={targetCat.image}
                                className="w-24 h-24 rounded-xl object-cover flex-shrink-0 shadow-inner cursor-pointer hover:opacity-80 transition border border-gray-100"
                                alt={targetCat.name}
                                onClick={() => handleOpenImage(targetCat)}
                            />

                            {/* 3. รายละเอียดแมว */}
                            <div className="flex-1 min-w-0">
                                <h2 className="font-black text-xl text-gray-800 truncate mb-1">
                                    {targetCat.name}
                                </h2>
                                
                                <div className="text-xs text-gray-600 space-y-1">
                                    <p><strong>Breed:</strong> {targetCat.breed || "—"}</p>
                                    <p><strong>Color:</strong> {targetCat.color || "—"}</p>
                                    <p><strong>Age:</strong> {targetCat.age ? `${targetCat.age} yrs` : "—"}</p>
                                    <p>
                                        <strong>Pedigree:</strong>{" "}
                                        {targetCat.PetdreegreeImage ? (
                                            <span className="text-green-600 font-bold">Yes</span>
                                        ) : (
                                            <span className="text-red-400 font-bold">No</span>
                                        )}
                                    </p>
                                    <p className="flex items-center gap-1">
                                        <img src="/images/location.png" className="w-3 h-3" alt="Loc" />
                                        {targetCat.province || "—"}
                                    </p>
                                    <p className="flex items-center gap-1">
                                        <strong>Gender:</strong> 
                                        {genderData?.img && (
                                            <img src={genderData.img} className="w-3.5 h-3.5" alt="Sex" />
                                        )}
                                        <span className={genderData?.color || 'text-gray-600'}>
                                            {targetCat.gender || "—"}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* 4. สถานะและวันที่ (ฝั่งขวาสุด) */}
                            <div className="flex flex-col items-end flex-shrink-0 border-l border-gray-100 pl-4 min-w-[80px]">
                                <p className={`text-sm font-black mb-2 flex items-center gap-1 ${h.liked ? 'text-pink-500' : 'text-gray-400'}`}>
                                    {h.liked ? "LIKED" : "NOPE"}
                                    <img 
                                        src={h.liked ? "/images/Likematch.png" : "/images/dislike.png"} 
                                        className="w-4 h-4 object-contain" 
                                        alt="Status Icon" 
                                    />
                                </p>
                                <div className="text-[10px] text-gray-400 text-right leading-tight">
                                    {new Date(h.createdAt).toLocaleDateString()}
                                    <br />
                                    {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {history.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 mt-10">
                    <p className="text-gray-400 text-xl font-medium">😺 No swipe history found</p>
                </div>
            )}
        </div>
    );
}