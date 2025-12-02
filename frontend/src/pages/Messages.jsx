import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

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

  const user = JSON.parse(localStorage.getItem("user"));

  /* ================================
      CONTEXT MENU : MESSAGE
  ================================= */
  const [msgMenu, setMsgMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    msg: null,
  });

  const openMsgMenu = (e, msg) => {
    e.preventDefault();
    setMsgMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      msg,
    });
  };

  const closeMsgMenu = () =>
    setMsgMenu({ show: false, x: 0, y: 0, msg: null });

  /* ================================
      CONTEXT MENU : CHAT LIST
  ================================= */
  const [chatMenu, setChatMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    chat: null,
  });

  const openChatMenu = (e, chat) => {
    e.preventDefault();
    setChatMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      chat,
    });
  };

  const closeChatMenu = () =>
    setChatMenu({ show: false, x: 0, y: 0, chat: null });

  useEffect(() => {
    const closeMenus = () => {
      closeMsgMenu();
      closeChatMenu();
    };
    document.addEventListener("click", closeMenus);
    return () => document.removeEventListener("click", closeMenus);
  }, []);

  /* ================================
      PIN CHAT
  ================================= */
  const togglePinChat = () => {
    const chat = chatMenu.chat;
    if (!chat) return;

    const ownerId = chat.user._id || chat.user;

    setPinnedChats((prev) => {
      if (prev.includes(ownerId)) {
        return prev.filter((u) => u !== ownerId);
      }
      return [ownerId, ...prev];
    });

    closeChatMenu();
  };

  /* DELETE CHAT */
  const deleteChat = async () => {
    const chat = chatMenu.chat;
    if (!chat) return;
    if (!confirm("Delete this conversation?")) return;

    const ownerId = chat.user._id || chat.user;

    try {
      await api.delete(`/api/chat/${ownerId}`);

      setMatches((prev) =>
        prev.filter((m) => (m.user._id || m.user) !== ownerId)
      );
      setPinnedChats((prev) => prev.filter((u) => u !== ownerId));

      if (selected && (selected.user._id || selected.user) === ownerId) {
        setSelected(null);
        setMessages([]);
        navigate("/messages");
      }

      closeChatMenu();
    } catch (err) {
      console.error(err);
    }
  };

  /* ================================
      LOAD MATCH LIST
  ================================= */
  const loadMatches = async () => {
    try {
      const res = await api.get("/api/matching/matches");
      setMatches(res.data || []);
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
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!matches.length) return;

    if (!id || id === "undefined") {
      setSelected(null);
      setMessages([]);
      return;
    }

    loadChat(id);
  }, [id, matches]);

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================================
      TIME FORMAT
  ================================= */
  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
      PIN MESSAGE
  ================================= */
  const togglePinMessage = async () => {
    const msg = msgMenu.msg;
    if (!msg) return;

    try {
      await api.post("/api/chat/pin", {
        id: msg._id,
        pin: !msg.pinned,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m._id === msg._id ? { ...m, pinned: !m.pinned } : m
        )
      );

      closeMsgMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMessage = async () => {
    const msg = msgMenu.msg;
    if (!msg) return;

    try {
      await api.delete(`/api/chat/msg/${msg._id}`);
      setMessages((prev) => prev.filter((m) => m._id !== msg._id));
      closeMsgMenu();
    } catch (err) {
      console.error(err);
    }
  };

  /* ================================
      SEND MESSAGE
  ================================= */
  const sendText = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selected) return;

    const to = selected.user._id || selected.user;

    try {
      const res = await api.post("/api/chat/text", { to, text: input });
      setMessages((prev) => [...prev, res.data]);
      setInput("");
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
    } catch (err) {
      console.error(err);
    }
  };

  /* ================================
      SORT CHATS
  ================================= */
  const sortedChats = [
    ...matches.filter((m) => pinnedChats.includes(m.user._id || m.user)),
    ...matches.filter((m) => !pinnedChats.includes(m.user._id || m.user)),
  ];

  /* ================================
      UI
  ================================= */
  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex min-h-[70vh] bg-white border rounded-[30px] shadow-md overflow-hidden">

        {/* -------------------------------------
            SIDEBAR
        -------------------------------------- */}
        <aside className="w-[280px] border-r bg-pink-50 flex flex-col">
          <div className="p-4 border-b bg-white font-semibold text-slate-800 shadow-sm">
            Messages
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {sortedChats.map((cat) => {
              const ownerId =
              cat.user?._id ||
              cat.user ||
              cat.owner?._id;

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
                      selected &&
                      (selected.user._id || selected.user) === ownerId
                        ? "bg-white shadow border border-pink-200"
                        : "hover:bg-white/70"
                    }
                    ${
                      pinnedChats.includes(ownerId)
                        ? "border border-pink-400"
                        : ""
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={cat.cats[0]?.image}
                      className="w-11 h-11 rounded-full object-cover shadow-sm"
                    />
                    <div>
                      <p className="font-medium text-sm">
                        {cat.cats[0]?.name}
                      </p>
                      <p className="text-xs text-gray-600 w-[150px] truncate">
                        Chat now
                      </p>
                    </div>
                  </div>

                  {pinnedChats.includes(ownerId) && (
                    <span className="text-pink-500 text-xs">📌</span>
                  )}
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
              {/* HEADER */}
              <div className="border-b bg-white p-4 flex items-center gap-4 shadow-sm">
                <div className="flex -space-x-3">
                  {selected.cats?.slice(0, 3).map((cat, idx) => (
                    <img
                      key={idx}
                      src={cat.image}
                      className="w-11 h-11 rounded-full border-2 border-white shadow"
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
                            className="rounded-xl mb-2 max-h-40"
                          />
                        )}

                        <p className="text-sm">{msg.text}</p>
                        <p className="text-[10px] text-yellow-700 mt-1">
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    ))}
                </div>
              )}

              {/* NORMAL MESSAGES */}
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
                              className="rounded-xl mb-2 max-h-48"
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
                <div ref={chatEndRef} />
              </div>

              {/* INPUT BOX */}
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

      {/* MESSAGE CONTEXT MENU */}
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

      {/* CHAT CONTEXT MENU */}
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
    </section>
  );
}
