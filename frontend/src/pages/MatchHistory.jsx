import { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom"; 

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
    return null; // ไม่แสดงรูปภาพ ถ้าไม่ระบุ
};

export default function MatchHistory() {
    const [history, setHistory] = useState([]);

    // ⭐ NEW STATE: สำหรับ Image View Modal
    const [imageModal, setImageModal] = useState({
        open: false,
        image: null,
        name: null,
    });

    // ---------------------------------------------------------
    // Handlers
    // ---------------------------------------------------------

    const loadHistory = async () => {
        const res = await api.get("/api/matching/history");
        setHistory(res.data || []);
    };
    
    // ⭐ Image Modal Handlers
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

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------

    return (
        <div className="max-w-3xl mx-auto py-10 px-4">
            
            {/* ⭐ IMAGE VIEW MODAL UI */}
            {imageModal.open && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 cursor-pointer"
                    onClick={handleCloseImage}
                >
                    <div 
                        className="max-w-xl max-h-[90vh] w-full bg-white rounded-3xl overflow-hidden shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()} // ป้องกันการปิดเมื่อคลิกในรูป
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
            {/* ⭐ END IMAGE VIEW MODAL UI */}

            <h1 className="text-3xl font-bold mb-8 text-pink-600 flex items-center gap-3">
                <img src="/images/history.png" className="w-8 h-8" alt="History Icon" />
                Match History
            </h1>

            {history.map((h) => {
                const targetCat = h.targetCat;
                const genderData = getGenderImage(targetCat.gender);
                
                return (
                    <div
                        key={h._id}
                        className="flex items-start gap-4 bg-white shadow-lg border-l-4 p-4 rounded-xl mb-4 
                        hover:shadow-xl transition-shadow"
                        style={{ borderColor: h.liked ? '#EC4899' : '#9CA3AF' }} // สีชมพูสำหรับ Like, เทาสำหรับ Dislike
                    >
                        {/* ⭐ Image - คลิกเพื่อเปิด Modal */}
                        <img
                            src={targetCat.image}
                            className="w-24 h-24 rounded-lg object-cover flex-shrink-0 shadow-inner cursor-pointer hover:opacity-80 transition"
                            alt={targetCat.name}
                            onClick={() => handleOpenImage(targetCat)} // ⭐ เพิ่ม onClick Handler
                        />

                        <div className="flex-1">
                            <h2 className="font-extrabold text-xl text-gray-800 mb-1">
                                {targetCat.name}
                            </h2>
                            
                            {/* 2. รายละเอียดทั้งหมด */}
                            <div className="text-sm text-gray-700 space-y-1">
                                {/* Breed */}
                                <p className="flex items-center gap-2">
                                    <strong>Breed:</strong> {targetCat.breed || "—"}
                                </p>
                                
                                {/* Color */}
                                <p className="flex items-center gap-2">
                                    <strong>Color:</strong> {targetCat.color || "—"}
                                </p>
                                
                                {/* Age */}
                                <p className="flex items-center gap-2">
                                    <strong>Age:</strong> {targetCat.age ? `${targetCat.age} yrs` : "—"}
                                </p>

                                {/* ⭐ NEW: Province */}
                                <p className="flex items-center gap-2">
                                    <strong>Province:</strong> {targetCat.province || "—"}
                                </p>
                                
                                {/* Gender (รูปภาพอยู่หลังตัวหนังสือ) */}
                                <p className="flex items-center gap-2">
                                    <strong>
                                        Gender:
                                        {genderData?.img && (
                                            <img 
                                                src={genderData.img} 
                                                className="w-4 h-4 inline-block align-middle ml-1" 
                                                alt={genderData.label} 
                                            />
                                        )} 
                                    </strong> 
                                    <span className={genderData?.color || 'text-gray-600'}>
                                        {targetCat.gender || "—"}
                                    </span>
                                </p>
                            </div>

                        </div>
                        
                        {/* 3. สถานะและวันที่ */}
                        <div className="flex flex-col items-end flex-shrink-0">
                            <p className={`text-md font-bold mb-2 flex items-center gap-1 ${h.liked ? 'text-pink-500' : 'text-gray-500'}`}>
                                {h.liked ? "LIKED" : "DISLIKED"}
                                <img 
                                    src={h.liked ? "/images/Likematch.png" : "/images/dislike.png"} 
                                    className="w-4 h-4" 
                                    alt="Status Icon" 
                                />
                            </p>
                            <div className="text-xs text-gray-400 text-right">
                                {new Date(h.createdAt).toLocaleDateString()}
                                <br />
                                {new Date(h.createdAt).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                );
            })}

            {history.length === 0 && (
                <p className="text-gray-500 text-center mt-10 p-4 border border-dashed rounded-xl">
                    😺 No history match 
                </p>
            )}
        </div>
    );
}