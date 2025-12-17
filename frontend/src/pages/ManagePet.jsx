import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { BREEDS, CAT_COLORS } from "../petData"; 
import api from "../api";

// ⭐ NEW: Import ข้อมูล 77 จังหวัดจากไฟล์แยก
import THAI_PROVINCES from "../thaiProvinces"; 

// ⭐ ฟังก์ชันสำหรับจัดการ URL รูปภาพ (Backend Base URL)
const backendBase = import.meta.env.VITE_API_URL.replace("/api", "");

const fixImage = (img) => {
    if (!img) return null;
    if (img.startsWith("data:")) return img; // ถ้าเป็น base64
    if (img.startsWith("blob:")) return img; // ถ้าเป็น Blob URL (Preview ชั่วคราว)
    if (img.startsWith("http")) return img;  // ถ้าเป็น URL สมบูรณ์
    return `${backendBase}${img.startsWith("/") ? img : "/" + img}`;
};

// =================================================================
// 🎯 1. GenderSelect Component
// =================================================================
const GenderSelect = ({ value, onChange }) => {
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

export default function ManagePet() {
    const navigate = useNavigate(); 
    const [selectedSlot, setSelectedSlot] = useState(1);
    const [preview, setPreview] = useState(null);
    const [PetdreegeePreview, setPetdreegeePreview] = useState(null);
    const [allPets, setAllPets] = useState([{}, {}, {}, {}]);

    // ⭐ NEW STATE: สำหรับสถานะ Yes/No ของใบเพ็ด
    const [hasPetdreegree, setHasPetdreegree] = useState(false);

    const [form, setForm] = useState({
        name: "",
        breed: "",
        color: "",
        age: "",
        gender: "",
        province: "", 
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

    const loadAllPets = async () => {
        const newPets = [];
        for (let i = 1; i <= 4; i++) {
            try {
                const res = await api.get(`/api/pets/${i}`);
                newPets.push(res.data || {});
            } catch {
                newPets.push({});
            }
        }
        setAllPets(newPets);
    };

    const loadPet = async (slot) => {
        try {
            const res = await api.get(`/api/pets/${slot}`);
            const pet = res.data;

            if (pet && pet.name) {
                setForm({
                    ...pet,
                    imageFile: null,  
                    PetdreegreeImageFile: null 
                });
                
                setPreview(fixImage(pet.image));
                setPetdreegeePreview(fixImage(pet.PetdreegreeImage));
                setHasPetdreegree(!!pet.PetdreegreeImage);
            } else {
                resetForm();
            }
        } catch {
            resetForm();
        }
    };

    const resetForm = () => {
        setForm({
            name: "", breed: "", color: "", age: "", gender: "", province: "",
            image: null, PetdreegreeImage: null, imageFile: null, PetdreegreeImageFile: null
        });
        setPreview(null);
        setPetdreegeePreview(null);
        setHasPetdreegree(false); 
    };

    useEffect(() => { loadAllPets(); }, []);
    useEffect(() => { loadPet(selectedSlot); }, [selectedSlot]);

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm((prev) => ({ ...prev, imageFile: file }));
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
        }
    };

    const handlePetdreegreeImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm((prev) => ({ ...prev, PetdreegreeImageFile: file }));
            const objectUrl = URL.createObjectURL(file);
            setPetdreegeePreview(objectUrl);
        }
    };

    const openPopup = (title, data) => {
        setPopup({ open: true, title, desc: data.desc, img: data.img });
    };

    const savePet = async () => {
        if (!form.name || !form.breed || !form.color || !form.age) return alert("กรุณากรอกข้อมูลให้ครบ");
        if (!form.gender) return alert("กรุณาเลือกเพศ");
        if (!form.province) return alert("กรุณาเลือกจังหวัด");
        if (!form.imageFile && !form.image) return alert("กรุณาใส่รูปน้องแมว");

        if (hasPetdreegree && !PetdreegeePreview) return alert("กรุณาอัปโหลดรูปใบเพ็ดดีกรี");

        try {
            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("breed", form.breed);
            formData.append("color", form.color);
            formData.append("age", form.age);
            formData.append("gender", form.gender); 
            formData.append("province", form.province); 

            if (form.imageFile) {
                formData.append("image", form.imageFile);
            }

            if (hasPetdreegree) {
                if (form.PetdreegreeImageFile) {
                    formData.append("PetdreegreeImage", form.PetdreegreeImageFile);
                }
            } else {
                formData.append("PetdreegreeImage", ""); 
            }

            await api.post(`/api/pets/${selectedSlot}`, formData);
            alert(`บันทึกข้อมูลสำเร็จ!`);
            
            // ⭐ บังคับดึงข้อมูลใหม่ทันที
            await loadAllPets();
            await loadPet(selectedSlot);
            
            setForm(prev => ({ ...prev, imageFile: null, PetdreegreeImageFile: null }));
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการบันทึก");
        }
    };

    const deletePet = async (slot) => {
        if (!confirm(`ต้องการลบข้อมูลช่องที่ ${slot}?`)) return;
        try {
            await api.delete(`/api/pets/${slot}`);
            await loadAllPets();
            if (slot === selectedSlot) resetForm();
            alert("ลบสำเร็จ");
        } catch { alert("ลบไม่สำเร็จ"); }
    };

    return (
        <div className="w-full flex flex-col items-center py-12 px-4 gap-12 bg-gray-50 min-h-screen">
            
            <div className="w-full flex justify-start max-w-6xl">
                <button onClick={() => navigate("/matching")} className="px-6 py-2 rounded-full text-sm font-semibold text-gray-700 border-2 border-gray-300 hover:bg-white transition-colors flex items-center gap-2 shadow-sm">
                    <img src="/images/back.png" alt="Back" className="w-4 h-4" /> Back to Pairing Selection
                </button>
            </div>

            <h1 className="text-4xl font-bold flex items-center gap-3 text-gray-800">
                <img src="/images/cat.png" className="w-10 h-10 object-contain" alt="cat" /> Manage Your Cats
            </h1>

            {/* Slot Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl">
                {allPets.map((pet, i) => (
                    <div key={i} className={`p-4 rounded-2xl shadow-md cursor-pointer border-2 bg-white transition-all ${selectedSlot === i + 1 ? "border-pink-500 ring-4 ring-pink-100 scale-105" : "border-gray-100 hover:border-pink-200"}`} onClick={() => setSelectedSlot(i + 1)}>
                        <div className="w-full h-32 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border shadow-inner">
                            {pet?.image ? <img src={fixImage(pet.image)} className="w-full h-full object-cover" /> : <span className="text-gray-300 font-bold">Slot Empty</span>}
                        </div>
                        <p className="mt-3 font-bold text-gray-800">Channel {i + 1}</p>
                        <p className="text-sm text-gray-500 truncate">{pet?.name || "—"}</p>
                        {pet?.name && <button onClick={(e) => { e.stopPropagation(); deletePet(i+1); }} className="mt-2 w-full bg-red-50 text-red-500 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-all font-bold text-xs uppercase tracking-wider">Delete</button>}
                    </div>
                ))}
            </div>

            {/* Edit Form Section */}
            <div className="w-full max-w-5xl bg-white rounded-[3rem] shadow-xl p-10 border border-gray-100">
                <h2 className="text-2xl font-black mb-8 text-gray-800 border-b pb-4 flex items-center gap-2">
                    <img src="/images/paw-decor.png" className="w-6 h-6" alt="paw" />
                    Edit channel cat information {selectedSlot}
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* LEFT FORM */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Name</label>
                            <input type="text" className="w-full p-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-pink-400 outline-none transition-all" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter cat name" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Breed</label>
                            <div className="flex gap-2">
                                <select className="w-full p-3.5 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-pink-400" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })}>
                                    <option value="">Choose a breed</option>
                                    {Object.keys(BREEDS).map((b) => <option key={b} value={b}>{b}</option>)}
                                </select>
                                {form.breed && <button type="button" onClick={() => openPopup(form.breed, BREEDS[form.breed])} className="bg-pink-50 p-3 rounded-2xl hover:bg-pink-100 transition-colors border border-pink-200"><img src="/images/info.png" className="w-5 h-5" /></button>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Color</label>
                            <div className="flex gap-2">
                                <select className="w-full p-3.5 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-pink-400" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>
                                    <option value="">Choose a color</option>
                                    {Object.keys(CAT_COLORS).map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                                {form.color && <button type="button" onClick={() => openPopup(form.color, CAT_COLORS[form.color])} className="bg-pink-50 p-3 rounded-2xl hover:bg-pink-100 transition-colors border border-pink-200"><img src="/images/color.png" className="w-5 h-5" /></button>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Age (Years)</label>
                                <input type="number" className="w-full p-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-pink-400 outline-none" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Province</label>
                                <select className="w-full p-3.5 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-pink-400" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}>
                                    <option value="">Select Province</option>
                                    {THAI_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Gender</label>
                            <GenderSelect value={form.gender} onChange={(val) => setForm({ ...form, gender: val })} />
                        </div>

                        <button onClick={savePet} className="mt-6 w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-pink-200 transition-all active:scale-[0.98]">SAVE CAT INFORMATION</button>
                    </div>

                    {/* RIGHT — IMAGE AREA */}
                    <div className="flex flex-col items-center bg-gray-50 rounded-[2.5rem] p-8 border-2 border-dashed border-gray-200">
                        <p className="font-black text-gray-700 mb-4 uppercase tracking-widest text-sm">Cat Profile Picture</p>
                        <div className="w-72 h-72 bg-white border-4 border-white rounded-[3rem] shadow-2xl overflow-hidden flex items-center justify-center relative group">
                            {preview ? <img src={preview} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="preview" /> : <div className="text-gray-300 text-center font-bold">No picture<br/>Click to upload</div>}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImage} accept="image/*" />
                        </div>

                        {/* ⭐ Petdreegree Yes/No UI */}
                        <div className="mt-10 w-full flex flex-col items-center pt-8 border-t border-gray-200">
                            <p className="font-black text-gray-700 mb-5 text-center">DO YOU HAVE A PETDREEGREE RECORD?</p>
                            <div className="flex gap-4 mb-8">
                                <button
                                    type="button"
                                    onClick={() => setHasPetdreegree(true)}
                                    className={`px-10 py-3 rounded-2xl font-black transition-all border-2 ${hasPetdreegree ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-100' : 'bg-white text-gray-300 border-gray-200 hover:bg-gray-100'}`}
                                > YES </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHasPetdreegree(false);
                                        setPetdreegeePreview(null);
                                        setForm({...form, PetdreegreeImage: null, PetdreegreeImageFile: null});
                                    }}
                                    className={`px-10 py-3 rounded-2xl font-black transition-all border-2 ${!hasPetdreegree ? 'bg-gray-400 text-white border-gray-400 shadow-lg shadow-gray-100' : 'bg-white text-gray-300 border-gray-200 hover:bg-gray-100'}`}
                                > NO </button>
                            </div>

                            {hasPetdreegree && (
                                <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                    <div className="w-full h-44 bg-white border-2 border-dashed border-blue-200 rounded-[2rem] overflow-hidden shadow-inner flex items-center justify-center relative group">
                                        {PetdreegeePreview ? (
                                            <img src={PetdreegeePreview} className="w-full h-full object-contain p-2" alt="pedigree" />
                                        ) : (
                                            <div className="text-blue-300 text-xs text-center font-black">CLICK TO UPLOAD<br/>PETDREEGREE RECORD</div>
                                        )}
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePetdreegreeImage} accept="image/*" />
                                    </div>
                                    {PetdreegeePreview && (
                                        <button className="mt-4 text-red-500 underline text-xs font-black uppercase tracking-widest" onClick={() => {setPetdreegeePreview(null); setForm({...form, PetdreegreeImage: null, PetdreegreeImageFile: null});}}>
                                            Remove Record
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Popup Info */}
            {popup.open && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-md px-4">
                    <div className="bg-white p-8 rounded-[3rem] max-w-md shadow-2xl animate-in zoom-in duration-200 border-4 border-pink-100">
                        <h2 className="text-3xl font-black mb-4 text-gray-800 text-center">{popup.title}</h2>
                        <img src={popup.img} className="w-full h-64 object-cover rounded-[2rem] mb-6 shadow-xl" alt="info" />
                        <p className="text-gray-600 text-md mb-8 leading-relaxed text-center font-medium">{popup.desc}</p>
                        <button onClick={() => setPopup({ open: false })} className="bg-pink-500 hover:bg-pink-600 text-white py-4 rounded-2xl w-full font-black shadow-lg shadow-pink-200 transition-all uppercase">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}