import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { BREEDS, CAT_COLORS } from "../petData"; 
import api from "../api";

// ⭐ NEW: Import ข้อมูล 77 จังหวัดจากไฟล์แยก
import THAI_PROVINCES from "../thaiProvinces"; 

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

            if (pet) {
                setForm({
                    name: pet.name || "",
                    breed: pet.breed || "",
                    color: pet.color || "",
                    age: pet.age || "",
                    gender: pet.gender || "", 
                    province: pet.province || "", 
                    image: pet.image || null,
                    PetdreegreeImage: pet.PetdreegreeImage || null,
                    imageFile: null,      
                    PetdreegreeImageFile: null 
                });
                
                setPreview(pet.image || null);
                setPetdreegeePreview(pet.PetdreegreeImage || null);
                
                // ⭐ เช็คว่าถ้ามีข้อมูลใบเพ็ดเดิม ให้ตั้งค่าเป็น Yes
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
        setHasPetdreegree(false); // ⭐ รีเซ็ตสถานะเป็น No
    };

    useEffect(() => { loadAllPets(); }, []);
    useEffect(() => { loadPet(selectedSlot); }, [selectedSlot]);

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm((prev) => ({ ...prev, imageFile: file }));
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handlePetdreegreeImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm((prev) => ({ ...prev, PetdreegreeImageFile: file }));
            const reader = new FileReader();
            reader.onloadend = () => setPetdreegeePreview(reader.result);
            reader.readAsDataURL(file);
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

        // ⭐ Validation ถ้าเลือก Yes ต้องมีรูปใบเพ็ด
        if (hasPetdreegree && !PetdreegeePreview) return alert("กรุณาอัปโหลดรูปใบเพ็ดดีกรี");

        try {
            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("breed", form.breed);
            formData.append("color", form.color);
            formData.append("age", form.age);
            formData.append("gender", form.gender); 
            formData.append("province", form.province); 

            if (form.imageFile) formData.append("image", form.imageFile);
            else if (form.image) formData.append("image", form.image);

            // ⭐ ส่งรูปใบเพ็ดเฉพาะเมื่อสถานะเป็น Yes
            if (hasPetdreegree) {
                if (form.PetdreegreeImageFile) formData.append("PetdreegreeImage", form.PetdreegreeImageFile);
                else if (form.PetdreegreeImage) formData.append("PetdreegreeImage", form.PetdreegreeImage);
            } else {
                // กรณีเลือก No อาจจะส่งค่าว่างเพื่อให้ Backend ลบรูปออก (ขึ้นอยู่กับ API Design)
                formData.append("PetdreegreeImage", ""); 
            }

            await api.post(`/api/pets/${selectedSlot}`, formData);
            alert(`บันทึกข้อมูลสำเร็จ!`);
            loadAllPets();
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
            if (slot === selectedSlot) resetForm();
            loadAllPets();
            alert("ลบสำเร็จ");
        } catch { alert("ลบไม่สำเร็จ"); }
    };

    return (
        <div className="w-full flex flex-col items-center py-12 px-4 gap-12">
            
            <div className="w-full flex justify-start max-w-6xl">
                <button onClick={() => navigate("/matching")} className="px-6 py-2 rounded-full text-sm font-semibold text-gray-700 border-2 border-gray-300 hover:bg-gray-100 transition-colors flex items-center gap-2">
                    <img src="/images/back.png" alt="Back" className="w-4 h-4" /> Back to Pairing Selection
                </button>
            </div>

            <h1 className="text-4xl font-bold flex items-center gap-3 text-gray-800">
                <img src="/images/cat.png" className="w-10 h-10 object-contain" alt="cat" /> Manage Your Cats
            </h1>

            {/* Slot Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl">
                {allPets.map((pet, i) => (
                    <div key={i} className={`p-4 rounded-2xl shadow-md cursor-pointer border-2 bg-white transition-all ${selectedSlot === i + 1 ? "border-pink-500 ring-2 ring-pink-100" : "border-gray-200 hover:border-pink-200"}`} onClick={() => setSelectedSlot(i + 1)}>
                        <div className="w-full h-32 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                            {pet?.image ? <img src={pet.image} className="w-full h-full object-cover" /> : <span className="text-gray-400">ว่าง</span>}
                        </div>
                        <p className="mt-2 font-semibold">Channel {i + 1}</p>
                        <p className="text-sm text-gray-600 truncate">{pet?.name || "—"}</p>
                        {pet?.name && <button onClick={(e) => { e.stopPropagation(); deletePet(i+1); }} className="mt-2 w-full bg-red-500 text-white py-1.5 rounded-lg hover:bg-red-600 transition-colors">Delete</button>}
                    </div>
                ))}
            </div>

            {/* Edit Form Section */}
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg p-10 border border-gray-100">
                <h2 className="text-2xl font-bold mb-8 text-gray-800 border-b pb-4">
                    ✏️ Edit channel cat information {selectedSlot}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* LEFT FORM */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input type="text" className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

                        <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                        <div className="flex gap-2 mb-4">
                            <select className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-pink-400" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })}>
                                <option value="">Choose a breed</option>
                                {Object.keys(BREEDS).map((b) => <option key={b} value={b}>{b}</option>)}
                            </select>
                            {form.breed && <button type="button" onClick={() => openPopup(form.breed, BREEDS[form.breed])} className="bg-gray-200 px-3 rounded-xl hover:bg-gray-300 transition-colors"><img src="/images/info.png" className="w-5 h-5" /></button>}
                        </div>

                        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                        <div className="flex gap-2 mb-4">
                            <select className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-pink-400" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>
                                <option value="">Choose a color</option>
                                {Object.keys(CAT_COLORS).map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {form.color && <button type="button" onClick={() => openPopup(form.color, CAT_COLORS[form.color])} className="bg-gray-200 px-3 rounded-xl hover:bg-gray-300 transition-colors"><img src="/images/color.png" className="w-5 h-5" /></button>}
                        </div>

                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                        <input type="number" className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-pink-400 outline-none" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />

                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <GenderSelect value={form.gender} onChange={(val) => setForm({ ...form, gender: val })} />
                        
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <select className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-pink-400 outline-none" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}>
                            <option value="">Choose a Province</option>
                            {THAI_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>

                        <button onClick={savePet} className="mt-2 w-full bg-pink-500 hover:bg-pink-600 text-white py-3.5 rounded-xl font-bold shadow-md transition-all active:scale-[0.98]">Save cat information</button>
                    </div>

                    {/* RIGHT — IMAGE AREA */}
                    <div className="flex flex-col items-center">
                        <p className="font-bold text-gray-700 mb-3">Cat Picture</p>
                        <div className="w-64 h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-3xl overflow-hidden flex items-center justify-center relative group">
                            {preview ? <img src={preview} className="w-full h-full object-cover" /> : <div className="text-gray-400 text-sm">No picture<br/>Click to upload</div>}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImage} accept="image/*" />
                        </div>

                        {/* ⭐ NEW: Petdreegree Yes/No UI */}
                        <div className="mt-10 w-full flex flex-col items-center border-t pt-8">
                            <p className="font-bold text-gray-700 mb-4">Do you have a Petdreegree record?</p>
                            <div className="flex gap-4 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setHasPetdreegree(true)}
                                    className={`px-8 py-2.5 rounded-full font-bold border-2 transition-all ${hasPetdreegree ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                                > Yes </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHasPetdreegree(false);
                                        setPetdreegeePreview(null);
                                        setForm({...form, PetdreegreeImage: null, PetdreegreeImageFile: null});
                                    }}
                                    className={`px-8 py-2.5 rounded-full font-bold border-2 transition-all ${!hasPetdreegree ? 'bg-gray-500 text-white border-gray-500' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                                > No </button>
                            </div>

                            {/* แสดงส่วนอัปโหลดเฉพาะเมื่อเลือก Yes */}
                            {hasPetdreegree && (
                                <div className="w-full flex flex-col items-center transition-all animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="w-64 h-40 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center relative">
                                        {PetdreegeePreview ? (
                                            <img src={PetdreegeePreview} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-blue-400 text-xs text-center font-medium">Click to upload<br/>Petdreegree Record</div>
                                        )}
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePetdreegreeImage} accept="image/*" />
                                    </div>
                                    {PetdreegeePreview && (
                                        <button className="mt-3 text-red-500 underline text-xs font-bold" onClick={() => {setPetdreegeePreview(null); setForm({...form, PetdreegreeImage: null, PetdreegreeImageFile: null});}}>
                                            Remove image
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Popup */}
            {popup.open && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm px-4">
                    <div className="bg-white p-8 rounded-[2rem] max-w-md shadow-2xl animate-in zoom-in duration-200">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">{popup.title}</h2>
                        <img src={popup.img} className="w-full h-64 object-cover rounded-2xl mb-4 shadow-md" />
                        <p className="text-gray-700 text-sm mb-6 leading-relaxed">{popup.desc}</p>
                        <button onClick={() => setPopup({ open: false })} className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-3 rounded-xl w-full font-bold shadow-lg shadow-pink-200">Close</button>
                    </div>
                </div>
            )}

        </div>
    );
}