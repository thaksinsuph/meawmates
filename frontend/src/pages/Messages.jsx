import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { socket } from '../socket'; 

// =================================================================
// ⭐ NEW: ฟังก์ชันสำหรับกำหนดรูปภาพและสีของเพศ
// =================================================================
const getGenderImage = (gender) => {
    if (gender === "Male") {
        return { 
            img: "/images/male.png", 
            color: "text-blue-600"
        };
    }
    if (gender === "Female") {
        return { 
            img: "/images/female.png",
            color: "text-pink-600"
        };
    }
    return null;
};


// =================================================================
// ⭐ Image Modal Component
// =================================================================
const ImageModal = ({ src, onClose }) => {
    if (!src) return null;
    return (
        <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-sm" 
            onClick={onClose}
        >
            <div className="relative p-4 max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-white text-3xl p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                    &times;
                </button>
                <img 
                    src={src} 
                    alt="Enlarged Chat Image" 
                    className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
                />
            </div>
        </div>
    );
};

// =================================================================
// ⭐ Cat Profile Modal Component
// =================================================================
const CatProfileModal = ({ modalState, onClose, onSelectCat, handleOpenImageFromCatProfile }) => {
    if (!modalState || !modalState.open || !modalState.cats || modalState.cats.length === 0) return null;

    const { cats, selectedIndex, matchedCatName } = modalState;
    const cat = cats[selectedIndex];
    
    const breed = cat.breed || '—'; 
    const color = cat.color || '—'
    const ageDisplay = cat.age ? `${cat.age} yrs` : '—';
    const province = cat.province || '—'; 
    const genderData = cat.gender ? getGenderImage(cat.gender) : null; 
    const hasPedigree = !!cat.PetdreegreeImage || cat.hasPedigree === "Yes";
    const score = modalState.matchScore || 0;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border-4 border-pink-200 transform transition-all animate-fadeIn relative" onClick={(e) => e.stopPropagation()}>
                
                {/* Match Score Circle */}
                <div className="absolute -top-6 -right-6 z-20">
                    <div className={`w-20 h-20 rounded-full border-4 border-white flex flex-col items-center justify-center font-black shadow-xl
                        ${score >= 80 ? 'bg-green-500 text-white' : score >= 50 ? 'bg-yellow-500 text-white' : 'bg-pink-500 text-white'}`}>
                        <span className="text-xl leading-none">{score}%</span>
                        <span className="text-[10px] uppercase">Match</span>
                    </div>
                </div>

                <div className="text-center">
                    <h2 className="text-3xl font-black text-gray-800 mb-2 truncate px-4">{cat.name}</h2>
                    <p className="text-pink-500 font-bold text-sm mb-4 tracking-widest uppercase italic">Cat Profile</p>
                    
                    {/* Cat Selector */}
                    {cats.length > 1 && (
                        <div className="flex justify-center mb-6 gap-2 bg-pink-50 p-2 rounded-2xl">
                            {cats.map((c, index) => (
                                <button key={index} onClick={() => onSelectCat(index)} className={`w-12 h-12 rounded-xl border-2 transition-all overflow-hidden ${index === selectedIndex ? 'border-pink-500 scale-110 shadow-md' : 'border-white opacity-60'}`}>
                                    <img src={c.image} alt="thumb" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}  
                    
                    <div className="relative group mb-6">
                        <img src={cat.image} className="w-full h-72 object-cover rounded-[2rem] shadow-inner border-2 border-gray-100 cursor-pointer transition-transform active:scale-95" alt={cat.name} onClick={() => handleOpenImageFromCatProfile(cat.image)} />
                        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-gray-600 shadow-sm">Click to zoom 🔍</div>
                    </div>

                    {/* จัดระเบียบรายละเอียดแมว */}
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm text-left bg-gray-50 p-5 rounded-[1.5rem] border border-gray-100">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Breed</span>
                            <span className="font-bold text-gray-700 truncate">{breed}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Age</span>
                            <span className="font-bold text-gray-700">{ageDisplay}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Color</span>
                            <span className="font-bold text-gray-700 truncate">{color}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Pedigree</span>
                            {hasPedigree ? 
                                <span className="text-green-600 font-bold flex items-center gap-1">Yes <img src="/images/verify.png" className="w-3 h-3" alt="v" /></span> : 
                                <span className="text-red-400 font-bold">No</span>
                            }
                        </div>
                        <div className="flex flex-col col-span-2 border-t border-gray-200 pt-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Location</span>
                            <div className="flex items-center gap-1">
                                <img src="/images/location.png" className="w-3 h-3" alt="L" />
                                <span className="font-bold text-gray-700">{province}</span>
                            </div>
                        </div>
                        <div className="flex flex-col col-span-2 border-t border-gray-200 pt-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Gender</span>
                            <div className="flex items-center gap-2">
                                {genderData && <img src={genderData.img} className="w-5 h-5" alt="sex" />}
                                <span className={`font-bold ${genderData?.color || 'text-gray-700'}`}>{cat.gender || '—'}</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-[10px] text-gray-400 mt-4 italic">
                        Matched with your pet: <span className="text-pink-400 font-bold">{matchedCatName}</span>
                    </p>

                    <button onClick={onClose} className="bg-gradient-to-r from-gray-700 to-gray-900 text-white py-4 rounded-2xl w-full mt-6 font-black shadow-lg hover:from-black hover:to-black transition-all active:scale-95 uppercase tracking-widest text-xs">
                        Back to Chat
                    </button>
                </div>
            </div>
        </div>
    );
};


export default function Messages() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [matches, setMatches] = useState([]);
    const [selected, setSelected] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [file, setFile] = useState(null);
    const [pinnedChats, setPinnedChats] = useState([]);
    const chatEndRef = useRef(null);
    
    // ⭐ State สำหรับ Image Modal (ขยายรูปภาพที่ส่ง)
    const [imageModal, setImageModal] = useState(null); 
    const openImageModal = (src) => setImageModal(src);
    const closeImageModal = () => setImageModal(null);

    // ⭐ State สำหรับ Cat Profile Modal (แสดงข้อมูลแมวที่ Match) 
    const [catProfileModal, setCatProfileModal] = useState({
        open: false,
        cats: [],
        selectedIndex: 0,
        matchedCatName: null,
    });

    // ดึง user จาก local storage ครั้งเดียว
    const user = JSON.parse(localStorage.getItem("user"));

    // ⭐ NEW: ฟังก์ชันสำหรับโหลด Pet ของ User ล่าสุด
    const loadAllPets = async () => {
        try {
            const res = await api.get("/api/pets/me");
            const user = JSON.parse(localStorage.getItem("user"));
            // อัปเดต user object ใน local storage ให้มี pets array ที่สดใหม่
            localStorage.setItem("user", JSON.stringify({ ...user, pets: res.data }));
        } catch (err) {
            console.error("Failed to load user pets for message context:", err);
        }
    };
    
    /* ... CONTEXT MENU & UI LOGIC (unchanged) ... */
    const [msgMenu, setMsgMenu] = useState({ show: false, x: 0, y: 0, msg: null });
    const openMsgMenu = (e, msg) => { e.preventDefault(); setMsgMenu({ show: true, x: e.clientX, y: e.clientY, msg }); };
    const closeMsgMenu = () => setMsgMenu({ show: false, x: 0, y: 0, msg: null });

    const [chatMenu, setChatMenu] = useState({ show: false, x: 0, y: 0, chat: null });
    const openChatMenu = (e, chat) => { e.preventDefault(); setChatMenu({ show: true, x: e.clientX, y: e.clientY, chat }); };
    const closeChatMenu = () => setChatMenu({ show: false, x: 0, y: 0, msg: null });

    useEffect(() => {
        const closeMenus = () => { closeMsgMenu(); closeChatMenu(); };
        document.addEventListener("click", closeMenus);
        return () => document.removeEventListener("click", closeMenus);
    }, []);

    const togglePinChat = () => { closeChatMenu(); console.log("Pin Chat Toggle"); };
    const deleteChat = async () => { closeChatMenu(); console.log("Delete Chat"); };
    const togglePinMessage = async () => { closeMsgMenu(); console.log("Pin Message Toggle"); };
    const deleteMessage = async () => { closeMsgMenu(); console.log("Delete Message"); };

    /* ... LOAD MATCH LIST & NOTIFICATION (unchanged) ... */
    const loadMatches = async () => {
        try {
            const res = await api.get("/api/matching/matches");
            const updatedMatches = res.data.map(m => m);
            setMatches(updatedMatches || []);
        } catch (err) {
            console.error(err);
        }
    };

    // ⭐ NEW: ฟังก์ชัน Mark as Seen ที่เรียก API ใหม่
    const markChatAsRead = async (otherId) => {
        try {
            // ⭐ เรียก API Mark as Seen ที่เราเพิ่งสร้างใน Backend
            await api.post(`/api/chat/mark-as-seen/${otherId}`);
            loadMatches(); // อัปเดต Sidebar หลัง Mark as Seen สำเร็จ
        } catch (err) {
            console.error("Failed to mark chat as seen:", err);
        }
    };

    /* ... LOAD CHAT (UPDATED: โหลดอย่างเดียว) ... */
    const loadChat = async (otherId) => {
        if (!otherId || otherId === "undefined") { console.warn("❌ Invalid chat ID:", otherId); return; }
        try {
            // 1. โหลดข้อความ (ใช้ API ที่ไม่ Mark as Seen)
            const res = await api.get(`/api/chat/${otherId}`); 
            setMessages(res.data);
            
            const found = matches.find((m) => (m.user._id || m.user).toString() === otherId.toString());
            setSelected(found);
            
            // ❌ ไม่เรียก loadMatches() ที่นี่แล้ว

        } catch (err) {
            console.error(err);
        }
    };
    /* ================================
      MARK ALL AS READ ON PAGE LOAD
    ================================= */
    useEffect(() => {
        if (!user?._id) return;

        const markAllSeen = async () => {
            try {
                await api.post('/api/chat/mark-all-seen');
                loadMatches(); 
            } catch (err) {
                console.error("Failed to mark all messages as seen:", err);
            }
        };

        if (!id) {
            markAllSeen();
        }
        
    }, [user?._id, id]); 

    /* ================================
      SOCKET.IO CONNECTION AND LISTENERS
    ================================= */
    useEffect(() => {
        if (!user?._id) return;
        socket.emit('join', user._id); 
        const handleNewMessage = (newMessage) => {
            const fromUserId = newMessage.from;
            const otherUserId = selected?.user?._id || selected?.user;

            if (otherUserId === fromUserId || otherUserId === newMessage.to) {
                setMessages(prev => [...prev, newMessage]);
                // เมื่อรับข้อความมา ให้โหลด Match List ใหม่ เพื่ออัปเดตสถานะ Unread Count
                if (fromUserId !== user._id) { 
                    loadMatches();
                }
            } else {
                loadMatches(); 
            }
        };
        socket.on('message:new', handleNewMessage); 
        return () => { socket.off('message:new', handleNewMessage); };
    }, [selected, user?._id]); 

    // ⭐ FIX: โหลด Pet ของ User ก่อน Load Chat
    useEffect(() => { 
        loadMatches(); 
        loadAllPets(); // <-- เรียก API ดึง Pet ล่าสุดมาอัปเดต Local Storage
    }, [user?._id]); 
    
    useEffect(() => {
        if (!matches.length || !id || id === "undefined") { setSelected(null); setMessages([]); return; }
        loadChat(id);
    }, [id, matches.length]);

    // ⭐ NEW/FIX: ทำ Mark as Seen เมื่อห้องแชทเปิดสำเร็จ
    useEffect(() => {
        if (selected && id) {
            // ตรวจสอบว่าห้องแชทนี้มีข้อความที่ยังไม่ได้อ่านหรือไม่
            const chatHasUnseen = selected.unseenCount > 0;

            if (chatHasUnseen) {
                // ⭐ ทำ Mark as Seen ทันทีที่เข้าห้องแชท
                markChatAsRead(id); 
            }
        }
    }, [selected, id]); // จะทำงานเมื่อ selected หรือ id เปลี่ยน

    // ⭐ AUTO-SCROLL LOGIC: เลื่อนลงไปที่ข้อความล่าสุดเมื่อ messages เปลี่ยน
    useEffect(() => {
        requestAnimationFrame(() => {
             chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        });
    }, [messages]);

    // ⭐ Handler สำหรับปิด Cat Profile Modal
    const handleCloseCatProfile = () => {
        setCatProfileModal({ open: false, cats: [], selectedIndex: 0, matchedCatName: null });
    };

    // ⭐ NEW: Handler สำหรับเปิด Image Modal จากภายใน CatProfileModal
    const handleOpenImageFromCatProfile = (src) => {
        handleCloseCatProfile(); // 1. สั่งปิด CatProfileModal (ป๊อปอัพตัวแม่)
        openImageModal(src);     // 2. เปิด Image Modal (ซูมรูป)
    };

    // ⭐ Handler สำหรับเปิด Cat Profile Modal (FINAL FIX FOR N/A)
    const handleOpenCatProfile = () => {
    
    if (!selected || !selected.cats || selected.cats.length === 0) return;
    
    const updatedUser = JSON.parse(localStorage.getItem("user")); 
    let catName = 'N/A';
    const userPets = updatedUser.pets;
    const myCat = userPets?.find(c => c.slot === selected.myCatSlot); 

    if (myCat?.name) {
        catName = myCat.name;
    } else if (userPets && userPets.length > 0) {
        catName = userPets[0].name || 'N/A';
    }
    
    setCatProfileModal({
        open: true,
        cats: selected.cats,
        selectedIndex: 0,
        matchedCatName: catName,
        // ⭐ ตรวจสอบว่า API ส่ง matchScore มาในก้อนของ selected หรือไม่
        // ถ้าไม่มี ให้ใช้ fallback เป็นค่าที่เคยสไลด์ไว้ (ถ้ามีการส่งมา)
        matchScore: selected.cats[0]?.matchScore || selected.matchScore || 0 
    });
};

    const handleSelectCatInModal = (index) => {
        setCatProfileModal(prev => ({ ...prev, selectedIndex: index }));
    };

    /* ================================
      TIME FORMAT & GROUPING (unchanged)
      ================================= */
    const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const formatDateHeader = (ts) => {
        const d = new Date(ts);
        const today = new Date();
        const yesterday = new Date(Date.now() - 86400000);

        if (d.toDateString() === today.toDateString()) return "Today";
        if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

        return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const groupByDate = (msgs) => {
        const groups = {};
        msgs.forEach((msg) => {
            const day = new Date(msg.createdAt).toDateString();
            if (!groups[day]) groups[day] = [];
            groups[day].push(msg);
        });
        return groups;
    };

    /* ================================
      SEND MESSAGE (unchanged)
      ================================= */
    const sendText = async (e) => {
        e.preventDefault();
        if (!input.trim() || !selected) return;

        const to = selected.user._id || selected.user;
        
        try {
            const res = await api.post("/api/chat/text", { to, text: input });
            setMessages((prev) => [...prev, res.data]);
            setInput("");
            loadMatches(); // Update sidebar immediately after sending
        } catch (err) {
            console.error(err);
        }
    };
    
    const sendImage = async (e) => {
        e.preventDefault();
        if (!file || !selected) return;

        const to = selected.user._id || selected.user;

        try {
            const form = new FormData();
            form.append("file", file);
            form.append("to", to);

            const res = await api.post("/api/chat/image", form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setMessages((prev) => [...prev, res.data]);
            setFile(null);
            loadMatches(); // Update sidebar immediately after sending
        } catch (err) {
            console.error(err);
        }
    };

    /* ================================
      SORT CHATS (unchanged)
      ================================= */
    const sortedChats = matches
        .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
        .map(m => {
            if (pinnedChats.includes(m.user._id || m.user)) {
                return { ...m, isPinned: true };
            }
            return m;
        })
        .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    /* ================================
      UI
      ================================= */
    return (
        <section className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex min-h-[70vh] max-h-[85vh] bg-white border rounded-[30px] shadow-md overflow-hidden">

                {/* -------------------------------------
                        SIDEBAR (Chat List)
                    -------------------------------------- */}
                <aside className="w-[280px] border-r bg-pink-50 flex flex-col">
                    <div className="p-4 border-b bg-white font-semibold text-slate-800 shadow-sm">
                        Messages
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 pb-3">
                        {sortedChats.map((cat) => {
                            const ownerId = cat.user?._id || cat.user || cat.owner?._id;
                            
                            // ⭐ FIX: ใช้ unseenCount เป็นตัวบ่งชี้หลักและแสดงผล
                            const unreadCount = cat.unseenCount || 0; 
                            const isUnread = unreadCount > 0;
                            
                            const lastMsgText = cat.lastMessageContent || "Chat now"; 

                            if (!ownerId || typeof ownerId !== "string" || ownerId.length !== 24) {
                                console.warn("❌ Invalid ownerId:", ownerId);
                                return null;
                            }
                            
                            return (
                                <div
                                    key={ownerId}
                                    onClick={() => navigate(`/messages/${ownerId}`)}
                                    onContextMenu={(e) => openChatMenu(e, cat)}
                                    className={`flex items-center justify-between p-3 mb-2 cursor-pointer rounded-2xl transition-all
                                        ${
                                            selected && (selected.user._id || selected.user) === ownerId
                                                ? "bg-white shadow border border-pink-200"
                                                : "hover:bg-white/70"
                                        }
                                        ${
                                            cat.isPinned
                                                ? "border border-pink-400"
                                                : ""
                                        }
                                        ${ isUnread ? "bg-pink-100 font-bold" : "" }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={cat.cats[0]?.image}
                                            className="w-11 h-11 rounded-full object-cover shadow-sm"
                                            alt={cat.cats[0]?.name}
                                        />
                                        <div>
                                            <p className={`font-medium text-sm ${isUnread ? "text-pink-600" : ""}`}>
                                                {cat.cats[0]?.name}
                                            </p>
                                            {/* ⭐ FIX: ข้อความล่าสุดเป็นตัวหนาถ้ามีข้อความใหม่ */}
                                            <p className={`text-xs w-[150px] truncate ${isUnread ? "text-slate-800 font-bold" : "text-gray-600"}`}>
                                                {lastMsgText} 
                                            </p>
                                        </div>
                                    </div>

                                    {/* ⭐ FIX: Unread Count / Pin Icon */}
                                    <div className="flex flex-col items-end gap-0.5"> 
                                        {/* 1. แสดง Unread Count */}
                                        {unreadCount > 0 && (
                                            <span className="text-xs font-bold bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center">
                                                {unreadCount > 99 ? '99+' : unreadCount} 
                                            </span>
                                        )}
                                        {/* 2. แสดง Pin Icon (ถ้าไม่มี Unread Count) */}
                                        {cat.isPinned && unreadCount === 0 && (
                                            <span className="text-pink-500 text-xs">📌</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* -------------------------------------
                        CHAT AREA
                    -------------------------------------- */}
                <main className="flex-1 flex flex-col bg-gradient-to-b from-white to-pink-50">
                    {selected ? (
                        <>
                            {/* ⭐ HEADER (Clickable to open Cat Profile Modal) ⭐ */}
                            <div 
                                className="border-b bg-white p-4 flex items-center gap-4 shadow-sm cursor-pointer hover:bg-pink-50 transition"
                                onClick={handleOpenCatProfile} // ⭐ Added onClick Handler
                            >
                                <div className="flex -space-x-3">
                                    {selected.cats?.slice(0, 3).map((cat, idx) => (
                                        <img
                                            key={idx}
                                            src={cat.image}
                                            className="w-11 h-11 rounded-full border-2 border-white shadow"
                                            alt={cat.name}
                                        />
                                    ))}

                                    {selected.cats?.length > 3 && (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                                            +{selected.cats.length - 3}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg text-slate-800">
                                        {selected.cats?.map((c) => c.name).join(" • ")}
                                    </h3>
                                    <p className="text-xs text-gray-500">Matched Cat Owner</p>
                                </div>
                            </div>

                            {/* PINNED MESSAGES (unchanged) */}
                            {messages.some((m) => m.pinned) && (
                                <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
                                    <p className="text-xs text-yellow-700 font-semibold mb-2">
                                        📌 Pinned messages
                                    </p>

                                    {messages
                                        .filter((m) => m.pinned)
                                        .map((msg) => (
                                            <div
                                                key={msg._id}
                                                onContextMenu={(e) => openMsgMenu(e, msg)}
                                                className="bg-yellow-100 text-yellow-900 px-4 py-2 rounded-xl mb-2 shadow-sm cursor-pointer"
                                            >
                                                {msg.image && (
                                                    <img
                                                        src={msg.image}
                                                        className="rounded-xl mb-2 max-h-40 cursor-pointer"
                                                        onClick={() => openImageModal(msg.image)} 
                                                        alt="Pinned message image"
                                                    />
                                                )}

                                                <p className="text-sm">{msg.text}</p>
                                                <p className={`text-[10px] text-yellow-700 mt-1`}>
                                                    {formatTime(msg.createdAt)}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            )}

                            {/* NORMAL MESSAGES (unchanged) */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4"> 
                                {Object.entries(
                                    groupByDate(messages.filter((m) => !m.pinned))
                                ).map(([day, msgs]) => (
                                    <div key={day}>
                                        <p className="text-center text-xs text-gray-400 mb-3">
                                            {formatDateHeader(msgs[0].createdAt)}
                                        </p>

                                        {msgs.map((msg) => (
                                            <div
                                                key={msg._id}
                                                className={`flex ${
                                                    msg.from === user._id
                                                        ? "justify-end"
                                                        : "justify-start"
                                                }`}
                                            >
                                                <div
                                                    onContextMenu={(e) => openMsgMenu(e, msg)}
                                                    className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm cursor-pointer shadow-sm transition-all
                                                        ${
                                                            msg.from === user._id
                                                                ? "bg-pink-500 text-white rounded-br-none"
                                                                : "bg-white border rounded-bl-none"
                                                        }
                                                    `}
                                                >
                                                    {msg.image && (
                                                        <img
                                                            src={msg.image}
                                                            className="rounded-xl mb-2 max-h-48 cursor-pointer"
                                                            onClick={() => openImageModal(msg.image)} 
                                                            alt="Message image"
                                                        />
                                                    )}

                                                    <p>{msg.text}</p>

                                                    <p
                                                        className={`text-[10px] mt-1 ${
                                                            msg.from === user._id
                                                                ? "text-pink-100"
                                                                : "text-gray-400"
                                                        }`}
                                                    >
                                                        {formatTime(msg.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                <div ref={chatEndRef} /> {/* ⭐ Auto-Scroll Ref */}
                            </div>

                            {/* INPUT BOX (unchanged) */}
                            <form
                                className="p-4 border-t bg-white flex items-center gap-3 shadow-sm"
                                onSubmit={(e) => (file ? sendImage(e) : sendText(e))}
                            >
                                <label className="cursor-pointer text-pink-500 text-xl">
                                    📎
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => setFile(e.target.files[0])}
                                    />
                                </label>

                                {file && (
                                    <span className="text-xs text-gray-600">{file.name}</span>
                                )}

                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 px-4 py-2 rounded-2xl border text-sm"
                                />

                                <button className="p-3 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow">
                                    ➤
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex items-center justify-center flex-1 text-gray-400">
                            Select a match to start chatting 💬
                        </div>
                    )}
                </main>
            </div>

            {/* MESSAGE CONTEXT MENU (unchanged) */}
            {msgMenu.show && (
                <div
                    className="fixed z-50 bg-white border shadow-xl rounded-lg py-2 w-44 text-sm animate-fadeIn"
                    style={{ top: msgMenu.y, left: msgMenu.x }}
                >
                    <button
                        onClick={togglePinMessage}
                        className="block w-full text-left px-4 py-2 hover:bg-pink-50"
                    >
                        📌 {msgMenu.msg?.pinned ? "Unpin message" : "Pin message"}
                    </button>

                    <button
                        onClick={deleteMessage}
                        className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-500"
                    >
                        🗑 Delete message
                    </button>
                </div>
            )}

            {/* CHAT CONTEXT MENU (unchanged) */}
            {chatMenu.show && (
                <div
                    className="fixed z-50 bg-white border shadow-xl rounded-lg py-2 w-40 text-sm animate-fadeIn"
                    style={{ top: chatMenu.y, left: chatMenu.x }}
                >
                    <button
                        onClick={togglePinChat}
                        className="block w-full text-left px-4 py-2 hover:bg-pink-50"
                    >
                        📌{" "}
                        {pinnedChats.includes(
                            chatMenu.chat.user._id || chatMenu.chat.user
                        )
                            ? "Unpin Chat"
                            : "Pin Chat"}
                    </button>

                    <button
                        onClick={deleteChat}
                        className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-500"
                    >
                        🗑 Delete Chat
                    </button>
                </div>
            )}
            
            {/* Image Modal Component ถูกเรียกใช้ที่นี่ */}
            <ImageModal src={imageModal} onClose={closeImageModal} />

            {/* ⭐ Cat Profile Modal Component ถูกเรียกใช้ที่นี่ (NEW!) */}
            <CatProfileModal 
                modalState={catProfileModal} 
                onClose={handleCloseCatProfile} 
                onSelectCat={handleSelectCatInModal}
                handleOpenImageFromCatProfile={handleOpenImageFromCatProfile} // ⭐ ส่ง handler ที่แก้ไขแล้วเข้าไป
            />
            
        </section>
    );
}