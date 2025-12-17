import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { BREEDS, CAT_COLORS } from "../petData"; 
import api from "../api";

// ⭐ NEW: Import ข้อมูล 77 จังหวัดจากไฟล์แยก
import THAI_PROVINCES from "../thaiProvinces"; 

// =================================================================
// 🎯 1. GenderSelect Component: ใช้ปุ่มแสดงรูปภาพสำหรับเลือกเพศ (unchanged)
// =================================================================
const GenderSelect = ({ value, onChange }) => {
    // โค้ด GenderSelect เหมือนเดิม
    const genders = [
        { 
            value: "Male", 
            label: "Male", 
            img: "/images/male.png", 
            style: "border-blue-300 text-blue-500 hover:bg-blue-50" 
        },
        { 
            value: "Female", 
            label: "Female", 
            img: "/images/female.png", 
            style: "border-pink-300 text-pink-500 hover:bg-pink-50" 
        },
    ];

    return (
        <div className="flex gap-3 mb-4">
            {genders.map((g) => (
                <button
                    key={g.value}
                    type="button" 
                    onClick={() => onChange(g.value)}
                    className={`flex items-center justify-center gap-2 p-3 flex-1 rounded-xl 
                        font-medium transition-all shadow-sm border-2
                        ${g.style}
                        ${value === g.value 
                            ? 'ring-2 ring-offset-2 ring-pink-500' 
                            : 'bg-white/80 border-gray-200 text-gray-700' 
                        }
                    `}
                >
                    <img src={g.img} className="w-5 h-5 object-contain" alt={g.label} />
                    {g.label}
                </button>
            ))}
        </div>
    );
};
// =================================================================


export default function ManagePet() {
    const navigate = useNavigate(); 
    const [selectedSlot, setSelectedSlot] = useState(1);
    const [preview, setPreview] = useState(null);
    const [PetdreegeePreview, setPetdreegeePreview] = useState(null);
    const [allPets, setAllPets] = useState([{}, {}, {}, {}]);

    const [form, setForm] = useState({
        name: "",
        breed: "",
        color: "",
        age: "",
        gender: "",
        province: "", // ✅ เพิ่ม province state
        image: null,      
        PetdreegreeImage: null, 
        imageFile: null,  
        PetdreegreeImageFile: null 
    });

    const [popup, setPopup] = useState({
        open: false,
        title: "",
        img: "",
        desc: "",
    });

    // ----------------------------
    // 📌 Load all pet slots (FIXED: ใช้ /api/pets/me และจัดการ Slot Array)
    // ----------------------------
    const loadAllPets = async () => {
        const newPets = [];
        for (let i = 1; i <= 4; i++) {
            try {
                // 💡 ใช้ API call เดิม /api/pets/:slot
                const res = await api.get(`/api/pets/${i}`);
                newPets.push(res.data || {});
            } catch {
                newPets.push({});
            }
        }
        setAllPets(newPets);
    };

    // ----------------------------
    // 📌 Load specific pet slot (MODIFIED: เพิ่ม province)
    // ----------------------------
    const loadPet = async (slot) => {
        try {
            const res = await api.get(`/api/pets/${slot}`);
            const pet = res.data;

            if (pet) {
                setForm({
                    name: pet.name || "",
                    breed: pet.breed || "",
                    color: pet.color || "",
                    age: pet.age || "",
                    gender: pet.gender || "", 
                    province: pet.province || "", // ✅ โหลดข้อมูลจังหวัด
                    image: pet.image || null,
                    PetdreegreeImage: pet.PetdreegreeImage || null,
                    imageFile: null,      
                    PetdreegreeImageFile: null 
                });
                
                // ⭐ ใช้ URL ที่สมบูรณ์จาก Backend โดยตรง (ตามที่แจ้งว่าโค้ดเดิมทำงานได้)
                setPreview(pet.image || null);
                setPetdreegeePreview(pet.PetdreegreeImage || null);
            } else {
                resetForm();
            }
        } catch {
            resetForm();
        }
    };

    // reset form (MODIFIED: เพิ่ม province)
    const resetForm = () => {
        setForm({
            name: "",
            breed: "",
            color: "",
            age: "",
            gender: "", 
            province: "", // ✅ รีเซ็ตจังหวัด
            image: null,
            PetdreegreeImage: null,
            imageFile: null,
            PetdreegreeImageFile: null
        });

        setPreview(null);
        setPetdreegeePreview(null);
    };

    // ... (useEffects)
    useEffect(() => {
        loadAllPets();
    }, []);

    useEffect(() => {
        loadPet(selectedSlot);
    }, [selectedSlot]);

    // ----------------------------
    // 📌 Upload cat image (UNCHANGED)
    // ----------------------------
    const handleImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm((prev) => ({ ...prev, imageFile: file }));
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // ----------------------------
    // 📌 Upload Petdreegree Image (UNCHANGED)
    // ----------------------------
    const handlePetdreegreeImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm((prev) => ({ ...prev, PetdreegreeImageFile: file }));

            const reader = new FileReader();
            reader.onloadend = () => {
                setPetdreegeePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const openPopup = (title, data) => {
        setPopup({
            open: true,
            title,
            desc: data.desc,
            img: data.img,
        });
    };

    // ----------------------------
    // 📌 Save cat (MODIFIED: เพิ่ม province validation/data)
    // ----------------------------
    const savePet = async () => {
        // Validation
        if (!form.name || !form.breed || !form.color || !form.age) {
            return alert("กรุณากรอกข้อมูลให้ครบ (ชื่อ, พันธุ์, สี, อายุ)");
        }
        if (!form.gender) {
            return alert("กรุณาเลือกเพศของน้องแมว"); 
        }
        if (!form.province) {
            return alert("กรุณาเลือกจังหวัดของน้องแมว"); // ✅ NEW Validation
        }

        if (!form.imageFile && !form.image) {
            return alert("กรุณาใส่รูปน้องแมวด้วย");
        }

        try {
            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("breed", form.breed);
            formData.append("color", form.color);
            formData.append("age", form.age);
            formData.append("gender", form.gender); 
            formData.append("province", form.province); // ✅ ส่งข้อมูลจังหวัด

            if (form.image) formData.append("image", form.image);
            if (form.PetdreegreeImage) formData.append("PetdreegreeImage", form.PetdreegreeImage);

            if (form.imageFile) {
                formData.append("image", form.imageFile);
            }
            
            if (form.PetdreegreeImageFile) {
                formData.append("PetdreegreeImage", form.PetdreegreeImageFile);
            }

            await api.post(`/api/pets/${selectedSlot}`, formData);
            
            alert(`บันทึกข้อมูลช่องที่ ${selectedSlot} สำเร็จ!`);
            loadAllPets();
            
            setForm(prev => ({ ...prev, imageFile: null, PetdreegreeImageFile: null }));

        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
    };

    // ----------------------------
    // ❌ Delete cat (UNCHANGED)
    // ----------------------------
    const deletePet = async (slot) => {
        if (!confirm(`ต้องการลบข้อมูลช่องที่ ${slot} ใช่หรือไม่?`)) return;

        try {
            await api.delete(`/api/pets/${slot}`);
            if (slot === selectedSlot) resetForm();
            loadAllPets();
            alert("ลบข้อมูลสำเร็จ");
        } catch {
            alert("ลบข้อมูลไม่สำเร็จ");
        }
    };
    
    // ----------------------------
    // ⭐ NEW: Back Button Handler (UNCHANGED)
    // ----------------------------
    const handleBack = () => {
        navigate("/matching"); 
    };

    return (
        <div className="w-full flex flex-col items-center py-12 px-4 gap-12">
            
            {/* ------------------ NEW: BACK BUTTON ------------------ */}
            <div className="w-full flex justify-start max-w-6xl">
                <button
                    onClick={handleBack}
                    className="
                        px-6 py-2 rounded-full text-sm font-semibold text-gray-700 border-2 border-gray-300
                        hover:bg-gray-100 transition-colors flex items-center gap-2
                    "
                >
                    <img 
                        src="/images/back.png" 
                        alt="Back Icon"
                        className="w-4 h-4 " 
                    />
                    Back to Pairing Selection
                </button>
            </div>
            {/* ------------------------------------------------------ */}

            {/* Title */}
            <h1 className="text-4xl font-bold flex items-center gap-3">
                <img
                    src="/images/cat.png"
                    alt="cat icon"
                    className="w-10 h-10 object-contain"
                />
                Manage Your Cats
            </h1>

            {/* --------------------------------
                Slot Cards (1–4)
            -------------------------------- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl">
                {allPets.map((pet, i) => (
                    <div
                        key={i}
                        className={`p-4 rounded-2xl shadow-md cursor-pointer border-2 
                        ${selectedSlot === i + 1 ? "border-pink-500" : "border-gray-200"}`}
                        onClick={() => setSelectedSlot(i + 1)}
                    >
                        <div className="w-full h-32 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                            {pet?.image ? (
                                <img src={pet.image} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gray-400">ว่าง</span>
                            )}
                        </div>

                        <p className="mt-2 font-semibold">Channel {i + 1}</p>
                        <p className="text-sm text-gray-600">{pet?.name || "—"}</p>

                        {pet?.name && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deletePet(i + 1);
                                }}
                                className="mt-2 w-full bg-red-500 text-white py-2 rounded-xl hover:bg-red-600"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* --------------------------------
                Edit Form Section
            -------------------------------- */}
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-md p-10">

                <h2 className="text-2xl font-bold mb-6">
                    ✏️ Edit channel cat information {selectedSlot}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                    {/* LEFT FORM */}
                    <div>
                        <label className="block text-sm mb-1">Name</label>
                        <input
                            type="text"
                            className="w-full p-3 border rounded-xl mb-4"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />

                        <label className="block text-sm mb-1">Breed</label>
                        <div className="flex gap-2 mb-4">
                            <select
                                className="w-full p-3 border rounded-xl"
                                value={form.breed}
                                onChange={(e) => setForm({ ...form, breed: e.target.value })}
                            >
                                <option value="">Choose a breed</option>
                                {Object.keys(BREEDS).map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>

                            {form.breed && (
                                <button
                                    type="button"
                                    onClick={() => openPopup(form.breed, BREEDS[form.breed])}
                                    className="bg-gray-200 px-3 py-2 rounded-xl flex items-center justify-center"
                                >
                                    <img src="/images/info.png" className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <label className="block text-sm mb-1">Color</label>
                        <div className="flex gap-2 mb-4">
                            <select
                                className="w-full p-3 border rounded-xl"
                                value={form.color}
                                onChange={(e) => setForm({ ...form, color: e.target.value })}
                            >
                                <option value="">Choose a color</option>
                                {Object.keys(CAT_COLORS).map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>

                            {form.color && (
                                <button
                                    type="button"
                                    onClick={() => openPopup(form.color, CAT_COLORS[form.color])}
                                    className="bg-gray-200 px-3 py-2 rounded-xl flex items-center justify-center"
                                >
                                    <img src="/images/color.png" className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <label className="block text-sm mb-1">Age</label>
                        <input
                            type="number"
                            className="w-full p-3 border rounded-xl mb-4"
                            value={form.age}
                            onChange={(e) => setForm({ ...form, age: e.target.value })}
                        />

                        <label className="block text-sm mb-1">Gender</label>
                        <GenderSelect 
                            value={form.gender}
                            onChange={(selectedGender) => setForm({ ...form, gender: selectedGender })}
                        />
                        
                        {/* ⭐ Province Field - ใช้ THAI_PROVINCES ที่ Import เข้ามา */}
                        <label className="block text-sm mb-1">Address</label>
                        <select
                            className="w-full p-3 border rounded-xl mb-4"
                            value={form.province}
                            onChange={(e) => setForm({ ...form, province: e.target.value })}
                        >
                            <option value="">Choose a Province</option>
                            {THAI_PROVINCES.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                        {/* ----------------------------- */}

                        <button
                            onClick={savePet}
                            className="mt-2 w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl font-semibold"
                        >
                            Save cat information
                        </button>
                    </div>

                    {/* RIGHT — IMAGE AREA (unchanged) */}
                    <div className="flex flex-col items-center">
                        <p className="font-medium mb-2">Cat Picture</p>

                        <div className="w-64 h-64 bg-gray-50 border rounded-2xl overflow-hidden">
                            {preview ? (
                                <img src={preview} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    No pictures
                                </div>
                            )}
                        </div>

                        <label className="mt-4 cursor-pointer bg-gray-100 px-4 py-2 rounded-xl">
                            Select picture
                            <input type="file" className="hidden" onChange={handleImage} accept="image/*" />
                        </label>

                        {/* ---------------------------
                            Petdreegree Picture
                        ---------------------------- */}
                        <div className="flex flex-col items-center mt-10">
                            <p className="font-medium mb-2 flex items-center gap-2">
                                Petdreegree Record
                            </p>

                            <div className="w-64 h-40 bg-blue-50 border border-blue-200 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                                {PetdreegeePreview ? (
                                    <img src={PetdreegeePreview} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-blue-400 text-sm">No Petdreegree record</div>
                                )}
                            </div>

                            <label className="mt-3 cursor-pointer bg-blue-100 px-4 py-2 rounded-xl hover:bg-blue-200 transition">
                                Upload Petdreegree Image
                                <input type="file" className="hidden" onChange={handlePetdreegreeImage} accept="image/*" />
                            </label>

                            {PetdreegeePreviewPreview && (
                                <button
                                    className="mt-2 text-red-500 underline text-sm"
                                    onClick={() => {
                                        setPetdreegeePreview(null);
                                        setForm({ ...form, PetdreegreeImage: null, PetdreegreeImageFile: null });
                                    }}
                                >
                                    Remove Petdreegree image
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* Popup (unchanged) */}
            {popup.open && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-2xl max-w-md shadow-lg">
                        <h2 className="text-xl font-bold mb-3">{popup.title}</h2>
                        <img src={popup.img} className="w-full h-64 object-cover rounded-xl mb-3" />
                        <p className="text-gray-700 text-sm mb-4">{popup.desc}</p>

                        <button
                            onClick={() => setPopup({ open: false })}
                            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-xl w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}