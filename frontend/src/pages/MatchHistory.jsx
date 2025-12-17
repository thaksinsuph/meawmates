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
        <div className="max-w-3xl mx-auto py-10 px-4 min-h-screen bg-gray-50">
            
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
                            className="flex items-center gap-4 bg-white shadow-md border-l-8 p-5 rounded-2xl hover:shadow-xl transition-all"
                            style={{ borderColor: h.liked ? '#EC4899' : '#9CA3AF' }}
                        >
                            {/* Image - คลิกเพื่อดูรูปใหญ่ */}
                            <div className="relative flex-shrink-0">
                                <img
                                    src={targetCat.image}
                                    className="w-28 h-28 rounded-2xl object-cover shadow-sm cursor-pointer hover:opacity-90 transition border border-gray-100"
                                    alt={targetCat.name}
                                    onClick={() => handleOpenImage(targetCat)}
                                />
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="font-black text-2xl text-gray-800 truncate max-w-[180px]">
                                        {targetCat.name}
                                    </h2>
                                    
                                    {/* ⭐ Match Score Badge (แสดงเฉพาะเมื่อ Liked) */}
                                    {h.liked && (
                                        <div className={`flex flex-col items-center px-3 py-1 rounded-xl border-2 shadow-sm ${
                                            score >= 80 ? 'bg-green-50 border-green-200 text-green-600' :
                                            score >= 50 ? 'bg-yellow-50 border-yellow-200 text-yellow-600' :
                                            'bg-pink-50 border-pink-200 text-pink-600'
                                        }`}>
                                            <span className="text-[10px] uppercase font-bold tracking-tighter leading-none">Match</span>
                                            <span className="text-lg font-black leading-none">{score}%</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* ข้อมูลแมวจัดเรียงตามที่ต้องการ */}
                                <div className="text-sm text-gray-600 grid grid-cols-2 gap-x-3 gap-y-1">
                                    <p><strong>Breed:</strong> {targetCat.breed || "—"}</p>
                                    <p><strong>Age:</strong> {targetCat.age ? `${targetCat.age} yrs` : "—"}</p>
                                    <p><strong>Color:</strong> {targetCat.color || "—"}</p>
                                    <p>
                                        <strong>Petdreegree:</strong>{" "}
                                        {targetCat.PetdreegreeImage ? (
                                            <span className="text-green-600 font-bold">Yes</span>
                                        ) : (
                                            <span className="text-red-400 font-bold">No</span>
                                        )}
                                    </p>
                                    <p className="col-span-2 flex items-center gap-1 mt-1 text-gray-500">
                                        <img src="/images/location.png" className="w-3.5 h-3.5" alt="Loc" />
                                        {targetCat.province || "—"}
                                    </p>
                                    <p className="col-span-2 flex items-center gap-1">
                                        <strong>Gender:</strong> 
                                        {genderData?.img && (
                                            <img src={genderData.img} className="w-4 h-4 ml-1" alt="Sex" />
                                        )}
                                        <span className={genderData?.color || 'text-gray-600'}>
                                            {targetCat.gender || "—"}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Status Section */}
                            <div className="flex flex-col items-end min-w-[90px] border-l border-gray-100 pl-4">
                                <div className={`flex items-center gap-1 font-black text-sm mb-2 ${h.liked ? 'text-pink-500' : 'text-gray-400'}`}>
                                    {h.liked ? "LIKED" : "NOPE"}
                                    <img 
                                        src={h.liked ? "/images/Likematch.png" : "/images/dislike.png"} 
                                        className="w-5 h-5 object-contain" 
                                        alt="Status" 
                                    />
                                </div>
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
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 mt-10">
                    <p className="text-gray-400 text-xl font-medium">😺 No swipe history found</p>
                    <p className="text-gray-300 text-sm mt-2">Start matching to see your history here!</p>
                </div>
            )}
        </div>
    );
}