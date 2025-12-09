import { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom"; // เพิ่ม Link เพื่อเชื่อมไปหน้าโปรไฟล์ (ถ้ามี)

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

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await api.get("/api/matching/history");
    setHistory(res.data || []);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
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
          <img
            src={targetCat.image}
            className="w-24 h-24 rounded-lg object-cover flex-shrink-0 shadow-inner"
            alt={targetCat.name}
          />

          <div className="flex-1">
            <h2 className="font-extrabold text-xl text-gray-800 mb-1">
                {targetCat.name}
            </h2>
            
            {/* 2. รายละเอียดทั้งหมด (ไม่มี ICON นำหน้า, มี ICON เพศต่อท้าย) */}
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
            <div className="text-xs text-gray-400">
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