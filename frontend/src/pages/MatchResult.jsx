import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
// ⭐ 1. นำเข้าฟังก์ชันคำนวณคะแนน
import { calculateMatchScore } from "../utils/matchCalculator"; 

// ---------------------------------------------------------
// Helper: สร้าง Full URL และแสดง Gender
// ---------------------------------------------------------

// ⭐ ใช้ API URL ของ backend เพื่อสร้าง path รูป
const backendBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : "";

// ⭐ Normalize รูปสัตว์เลี้ยงให้ใช้ได้จริง
const fixImage = (img) => {
    if (!img) return null;
    // ตรวจสอบว่าเป็น base64 หรือ URL ที่สมบูรณ์แล้วหรือไม่
    if (img.startsWith("data:")) return img;
    if (img.startsWith("http")) return img;
    // เชื่อมต่อกับ base URL ของ backend
    return `${backendBase}${img.startsWith("/") ? img : "/" + img}`;
};

// Helper function สำหรับแสดงผลเพศ (ใช้รูปภาพ)
const getGenderDisplay = (gender) => {
    if (gender === 'Male') {
        return (
            <span className="flex items-center gap-1 text-blue-600 font-medium">
                <img src="/images/male.png" className="w-4 h-4 object-contain" alt="Male"/>
                Male
            </span>
        );
    }
    if (gender === 'Female') {
        return (
            <span className="flex items-center gap-1 text-pink-600 font-medium">
                <img src="/images/female.png" className="w-4 h-4 object-contain" alt="Female"/>
                Female
            </span>
        );
    }
    return <span className="text-gray-500">—</span>;
};


// =================================================================
// ⭐ MatchResult Component
// =================================================================
export default function MatchResult() {
    const navigate = useNavigate();
    
    // State สำหรับเก็บข้อมูลการจับคู่ที่ดึงมาจาก localStorage
    const [pairingData, setPairingData] = useState(null); // { selectedCat, criteria }
    // State สำหรับเก็บผลลัพธ์แมวเป้าหมายพร้อมคะแนนที่คำนวณแล้ว
    const [results, setResults] = useState([]); 
    const [loading, setLoading] = useState(true);

    // ---------------------------------------------------------
    // 1. Load Pairing Data & Target Cats
    // ---------------------------------------------------------
    useEffect(() => {
        // ดึงข้อมูลที่เก็บไว้ใน localStorage จากหน้า Matching/Criteria
        const storedData = localStorage.getItem("pairingData");
        
        if (!storedData) {
            alert("ไม่พบข้อมูลแมวที่ถูกเลือก กรุณากลับไปเลือกแมวใหม่");
            navigate("/matching");
            return;
        }
        
        const data = JSON.parse(storedData);
        setPairingData(data);
        loadTargetCats(data);
        
        // ล้างข้อมูลทันทีหลังดึงไปใช้ เพื่อไม่ให้ค้างอยู่ใน localStorage
        localStorage.removeItem("pairingData"); 
    }, [navigate]);


    const loadTargetCats = async (data) => {
        const { selectedCat, criteria } = data;
        
        try {
            // โหลดแมวเป้าหมายทั้งหมดจาก API
            const res = await api.get("/api/matching/cats");
            let targetCats = res.data
                // กรองแมวตัวเองออก
                .filter(cat => cat._id !== selectedCat._id) 
                .map(cat => ({
                    ...cat,
                    image: fixImage(cat.image),
                }));

            // 2. คำนวณคะแนนและกรองผลลัพธ์
            const finalResults = targetCats
                .map(targetCat => {
                    // คำนวณคะแนนความเข้ากันได้
                    const score = calculateMatchScore(selectedCat, targetCat);
                    return { ...targetCat, score };
                })
                .filter(targetCat => {
                    // 3. กรองตามเกณฑ์ที่ผู้ใช้เลือก (Criteria)
                    const { targetBreed, targetAge, targetColor, targetGender } = criteria;
                    
                    let passesFilter = true;
                    
                    // กรองตามสายพันธุ์ (ถ้าผู้ใช้เลือก)
                    if (targetBreed && targetCat.breed !== targetBreed) {
                        passesFilter = false;
                    }

                    // กรองตามสี (ถ้าผู้ใช้เลือก)
                    if (passesFilter && targetColor && targetCat.color !== targetColor) {
                         passesFilter = false;
                    }
                    
                    // กรองตามเพศ (ถ้าผู้ใช้เลือก)
                    if (passesFilter && targetGender && targetCat.gender !== targetGender) {
                         passesFilter = false;
                    }
                    
                    // กรองตามอายุ (ถ้าผู้ใช้เลือก age max)
                    // targetAge เป็นปี, targetCat.age เป็นปี
                    if (passesFilter && targetAge !== null && targetCat.age > targetAge) {
                        passesFilter = false;
                    }

                    return passesFilter;
                })
                .sort((a, b) => b.score - a.score); // เรียงจากคะแนนสูงสุด

            setResults(finalResults);
            setLoading(false);

        } catch (err) {
            console.error("Load target cats error:", err);
            setLoading(false);
            alert("เกิดข้อผิดพลาดในการโหลดข้อมูลจับคู่");
        }
    };


    // ---------------------------------------------------------
    // 4. UI Rendering
    // ---------------------------------------------------------
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-xl text-gray-500">กำลังค้นหาคู่ที่เหมาะสม... 🐾</p>
            </div>
        );
    }
    
    const selectedCat = pairingData?.selectedCat;

    if (!selectedCat) {
        return (
            <div className="flex justify-center items-center h-screen flex-col">
                <p className="text-xl text-red-500">ข้อมูลแมวต้นทางไม่สมบูรณ์</p>
                <button 
                    onClick={() => navigate('/matching')}
                    className="mt-4 text-pink-600 hover:text-pink-700 font-medium"
                >
                    กลับไปหน้าเลือกแมว
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-12 px-4">
            
            <button 
                onClick={() => navigate('/matching')}
                className="mb-6 text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
            >
                &larr; กลับไปเลือกแมว
            </button>

            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
                🌟 ผลลัพธ์การจับคู่สำหรับ <span className="text-pink-600">{selectedCat.name}</span>
            </h1>
            <p className="text-gray-600 text-lg mb-8">
                พบแมวที่เข้าเกณฑ์ทั้งหมด {results.length} ตัว
            </p>

            {/* แสดงเกณฑ์ที่ใช้ในการกรอง */}
            {pairingData?.criteria && (
                <div className="bg-pink-50 p-4 rounded-xl mb-8 border border-pink-200">
                    <p className="font-semibold text-pink-700 mb-2">
                        เกณฑ์ที่ใช้กรอง:
                    </p>
                    <ul className="text-sm text-gray-700 list-disc ml-5">
                        {pairingData.criteria.targetBreed && <li>สายพันธุ์: **{pairingData.criteria.targetBreed}**</li>}
                        {pairingData.criteria.targetColor && <li>สี: **{pairingData.criteria.targetColor}**</li>}
                        {pairingData.criteria.targetGender && <li>เพศ: **{pairingData.criteria.targetGender}**</li>}
                        {pairingData.criteria.targetAge !== null && <li>อายุไม่เกิน: **{pairingData.criteria.targetAge} ปี**</li>}
                        
                        {/* ถ้าทุกค่าเป็น falsey (เช่น null, 0, '') ถือว่าไม่ได้กำหนดเกณฑ์ */}
                        {Object.values(pairingData.criteria).every(v => !v) && <li>ไม่มีการกำหนดเกณฑ์เฉพาะเจาะจง</li>}
                    </ul>
                </div>
            )}


            {/* LIST OF MATCHES */}
            <div className="space-y-6">
                {results.length > 0 ? (
                    results.map((targetCat) => (
                        <div 
                            key={targetCat._id}
                            className="flex items-center bg-white border rounded-2xl shadow-lg p-5 transition-transform hover:shadow-xl"
                        >
                            {/* Score Tag */}
                            <div className="w-20 mr-6 text-center flex flex-col justify-center items-center">
                                <p className="text-xs font-semibold text-gray-500">คะแนน</p>
                                <p className="text-3xl font-extrabold text-pink-600">{targetCat.score}%</p>
                                <p className="text-xs font-medium text-pink-500 mt-1">
                                    <span className="bg-pink-100 px-2 py-0.5 rounded-full">
                                        {targetCat.score >= 80 ? 'Perfect Match' : targetCat.score >= 60 ? 'Great Match' : 'Good Match'}
                                    </span>
                                </p>
                            </div>

                            {/* Image */}
                            <img 
                                src={targetCat.image} 
                                className="w-20 h-20 object-cover rounded-full border-2 border-pink-300 mr-6" 
                                alt={targetCat.name}
                            />
                            
                            {/* Info */}
                            <div className="flex-1">
                                <p className="text-xl font-bold text-gray-800">
                                    {targetCat.name} 
                                </p>
                                <div className="text-sm text-gray-600 flex gap-3 mt-1">
                                    <span>{targetCat.breed}</span>
                                    <span>•</span>
                                    {getGenderDisplay(targetCat.gender)}
                                    <span>•</span>
                                    <span>{targetCat.age} ปี</span>
                                </div>
                            </div>
                            
                            {/* Action Button */}
                            <button
                                // สมมติว่าต้องการ Chat กับเจ้าของแมวเป้าหมาย
                                onClick={() => navigate(`/messages/${targetCat.owner}`)}
                                className="bg-indigo-500 text-white px-5 py-2 rounded-xl font-semibold hover:bg-indigo-600 shadow-md transition"
                            >
                                ทักแชทหาเจ้าของ
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-2xl text-gray-500">ไม่พบแมวที่ตรงตามเกณฑ์ 😿</p>
                        <p className="text-md text-gray-400 mt-2">
                            ลองกลับไปเลือกแมวของคุณ หรือปรับเกณฑ์การจับคู่ให้กว้างขึ้น
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
}