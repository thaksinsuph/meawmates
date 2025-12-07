import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
// ⭐ 1. นำเข้า Socket Client จริง (สมมติว่าไฟล์นี้ถูกสร้างแล้วที่ src/socket.js)
import { socket } from '../socket'; 

// =================================================================
// ⭐ Image Modal Component (สำหรับแสดงรูปภาพขนาดเต็ม)
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
    
    // ⭐ State สำหรับ Image Modal
    const [imageModal, setImageModal] = useState(null); 
    const openImageModal = (src) => setImageModal(src);
    const closeImageModal = () => setImageModal(null);

    const user = JSON.parse(localStorage.getItem("user"));

    /* ================================
        CONTEXT MENU & UI LOGIC (unchanged)
     ================================= */
    const [msgMenu, setMsgMenu] = useState({
        show: false,
        x: 0, y: 0, msg: null,
    });
    const openMsgMenu = (e, msg) => {
        e.preventDefault();
        setMsgMenu({ show: true, x: e.clientX, y: e.clientY, msg });
    };
    const closeMsgMenu = () => setMsgMenu({ show: false, x: 0, y: 0, msg: null });

    const [chatMenu, setChatMenu] = useState({
        show: false,
        x: 0, y: 0, chat: null,
    });
    const openChatMenu = (e, chat) => {
        e.preventDefault();
        setChatMenu({ show: true, x: e.clientX, y: e.clientY, chat });
    };
    const closeChatMenu = () => setChatMenu({ show: false, x: 0, y: 0, chat: null });

    useEffect(() => {
        const closeMenus = () => { closeMsgMenu(); closeChatMenu(); };
        document.addEventListener("click", closeMenus);
        return () => document.removeEventListener("click", closeMenus);
    }, []);

    /* PIN/DELETE CHAT/MESSAGE LOGIC (Placeholder) */
    const togglePinChat = () => { closeChatMenu(); console.log("Pin Chat Toggle"); };
    const deleteChat = async () => { closeChatMenu(); console.log("Delete Chat"); };
    const togglePinMessage = async () => { closeMsgMenu(); console.log("Pin Message Toggle"); };
    const deleteMessage = async () => { closeMsgMenu(); console.log("Delete Message"); };

    /* ================================
        LOAD MATCH LIST & NOTIFICATION
     ================================= */
    const loadMatches = async () => {
        try {
            const res = await api.get("/api/matching/matches");
            
            const updatedMatches = res.data.map(m => {
                return m;
            });

            setMatches(updatedMatches || []);
        } catch (err) {
            console.error(err);
        }
    };

    /* ================================
        LOAD CHAT
     ================================= */
    const loadChat = async (otherId) => {
        if (!otherId || otherId === "undefined") {
            console.warn("❌ Invalid chat ID:", otherId);
            return;
        }
        try {
            const res = await api.get(`/api/chat/${otherId}`);
            setMessages(res.data);

            const found = matches.find(
                (m) => (m.user._id || m.user).toString() === otherId.toString()
            );

            setSelected(found);
            
            // เมื่อเปิดแชทแล้ว: โหลด Matches ใหม่เพื่อลบ Notification Dot
            loadMatches(); 
            
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
        
        // ⭐ 2. Join Room
        socket.emit('join', user._id); 

        // ⭐ 3. ฟังข้อความใหม่
        const handleNewMessage = (newMessage) => {
            const fromUserId = newMessage.from;
            const otherUserId = selected?.user?._id || selected?.user;

            if (otherUserId === fromUserId || otherUserId === newMessage.to) {
                // Case 1: ข้อความอยู่ในแชทปัจจุบัน -> แสดงผลทันที
                setMessages(prev => [...prev, newMessage]);
                
                if (fromUserId !== user._id) {
                    loadMatches();
                }
                
            } else {
                // Case 2: ข้อความมาจากแชทอื่น -> อัปเดต Matches List
                loadMatches(); 
            }
        };
        
        socket.on('message:new', handleNewMessage); 
        
        // Cleanup
        return () => {
            socket.off('message:new', handleNewMessage); 
        };
    }, [selected, user?._id]); 

    // Load Matches ครั้งแรก
    useEffect(() => {
        loadMatches();
    }, [user?._id]); 
    
    // Load Chat เมื่อเปลี่ยน ID
    useEffect(() => {
        if (!matches.length || !id || id === "undefined") {
            setSelected(null);
            setMessages([]);
            return;
        }
        loadChat(id);
    }, [id, matches.length]);

    // ⭐ 4. AUTO-SCROLL LOGIC: เลื่อนลงไปที่ข้อความล่าสุดเมื่อ messages เปลี่ยน
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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
            loadMatches(); 
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
            loadMatches(); 
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
            <div className="flex min-h-[70vh] bg-white border rounded-[30px] shadow-md overflow-hidden">

                {/* -------------------------------------
                             SIDEBAR (unchanged)
                         -------------------------------------- */}
                <aside className="w-[280px] border-r bg-pink-50 flex flex-col">
                    <div className="p-4 border-b bg-white font-semibold text-slate-800 shadow-sm">
                        Messages
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 pb-3">
                        {sortedChats.map((cat) => {
                            const ownerId = cat.user?._id || cat.user || cat.owner?._id;
                            const isUnread = cat.hasNewMessage; 
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
                                        />
                                        <div>
                                            <p className={`font-medium text-sm ${isUnread ? "text-pink-600" : ""}`}>
                                                {cat.cats[0]?.name}
                                            </p>
                                            <p className={`text-xs w-[150px] truncate ${isUnread ? "text-slate-800 font-semibold" : "text-gray-600"}`}>
                                                {lastMsgText} 
                                            </p>
                                        </div>
                                    </div>

                                    {/* Notification Dot / Pin Icon */}
                                    <div className="flex items-center gap-1">
                                        {isUnread && (
                                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse mr-1"></span>
                                        )}
                                        {cat.isPinned && (
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
                            {/* HEADER (unchanged) */}
                            <div className="border-b bg-white p-4 flex items-center gap-4 shadow-sm">
                                {/* ... โค้ดเดิม ... */}
                            </div>

                            {/* PINNED MESSAGES */}
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

                            {/* NORMAL MESSAGES */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4"> {/* ⭐ overflow-y-auto สำหรับ Scroll */}
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
                                                            onClick={() => openImageModal(msg.image)} // ⭐ Added onClick
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
                                {/* ... โค้ดเดิม ... */}
                            </form>
                        </>
                    ) : (
                        <div className="flex items-center justify-center flex-1 text-gray-400">
                            Select a match to start chatting 💬
                        </div>
                    )}
                </main>
            </div>

            {/* CONTEXT MENUS (unchanged) */}
            {/* ... โค้ดเดิม ... */}
            
            {/* Image Modal Component ถูกเรียกใช้ที่นี่ */}
            <ImageModal src={imageModal} onClose={closeImageModal} />
            
        </section>
    );
}