import { useEffect, useState } from "react";
import api from "../api"; 
import { getUser } from "../auth";
import { Link } from "react-router-dom";

export default function Saved() {
  const [posts, setPosts] = useState([]);
  const user = getUser();
  const backendBase = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

  useEffect(() => {
    if (user?._id) fetchSaved();
  }, [user]);

  const fetchSaved = async () => {
    try {
      const res = await api.get(`/api/posts/saved/${user._id}`);
      setPosts(res.data);
    } catch (err) {
      console.error("❌ Fetch saved posts error:", err);
    }
  };

  const toggleLike = async (id) => {
    try {
      const res = await api.post(`/api/posts/${id}/like`);
      const { liked } = res.data;
      setPosts((prev) =>
        prev.map((p) =>
          p._id === id
            ? {
                ...p,
                likes: liked
                  ? [...p.likes, user._id]
                  : p.likes.filter((uid) => uid !== user._id),
              }
            : p
        )
      );
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const toggleSave = async (id) => {
    try {
      await api.post(`/api/posts/${id}/save`);
      fetchSaved(); 
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const reportPost = async (id) => {
    const reason = prompt("Reason for reporting this post?");
    if (!reason) return;
    try {
      await api.post(`/api/posts/${id}/report`, { reason });
      alert("📩 Report submitted.");
    } catch (err) {
      console.error("Report error:", err);
    }
  };

  /* --- FIX URL & FALLBACK --- */
  const imageURL = (img) => {
    if (!img) return "https://placekitten.com/400/300"; 
    if (img.startsWith("data:") || img.startsWith("http")) return img;
    return `${backendBase}${img.startsWith("/") ? img : "/" + img}`;
  };

  const avatarURL = (av) => {
    if (!av) return "https://via.placeholder.com/150/CCCCCC/808080?text=User";
    if (av.startsWith("data:") || av.startsWith("http")) return av;
    return `${backendBase}${av.startsWith("/") ? av : "/" + av}`;
  };

  const isLiked = (p) => p.likes?.includes(user?._id);

  return (
    <div className="max-w-7xl mx-auto py-20 px-6">
      <h1 className="text-4xl font-bold flex items-center gap-3 mb-6">
        <img src="/images/Savedd.png" className="w-10 h-10" alt="Saved" 
             onError={(e) => e.target.style.display = 'none'} /> 
        Saved Posts
      </h1>

      {posts.length === 0 && (
        <div className="text-center mt-20">
            <p className="text-gray-400 text-xl">ยังไม่มีโพสต์ที่คุณบันทึกไว้</p>
        </div>
      )}

      {/* Grid Layout แบบเดิมเป๊ะ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {posts.map((p) => (
          <div key={p._id} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-3">
            
            {/* Post Image: เพิ่ม onError กันภาพแตก */}
            <Link to={`/post/${p._id}`}>
              <img
                src={imageURL(p.image)}
                className="w-full h-64 object-cover rounded-xl mb-3"
                alt="Post content"
                onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "https://placekitten.com/400/300"; // รูปสำรอง (แมว)
                }}
              />
            </Link>

            {/* Post Content */}
            <p className="text-gray-800 text-sm mb-2 h-10 overflow-hidden text-ellipsis line-clamp-2">
              {p.content || "(No message)"}
            </p>

            {/* Footer */}
            <div className="flex justify-between items-center">
              
              {/* User Info */}
              <div className="flex items-center gap-2">
                <img
                  src={avatarURL(p.author?.avatar)}
                  className="w-7 h-7 rounded-full border object-cover"
                  alt="Author"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/150/CCCCCC/808080?text=User";
                  }}
                />
                <p className="font-medium text-gray-700 text-sm max-w-[100px] truncate">
                    {p.author?.name || "Unknown"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4 text-sm items-center">
                <button onClick={() => toggleLike(p._id)} className="flex items-center gap-1">
                  <img
                    src="/images/Like.png"
                    className={`w-6 h-6 ${isLiked(p) ? "opacity-100 scale-110" : "opacity-40"}`}
                    alt="Like"
                  />
                  <span className="text-gray-700 text-sm">{p.likes?.length || 0}</span>
                </button>

                <button onClick={() => toggleSave(p._id)} className="flex items-center gap-1" title="Unsave">
                  <img src="/images/Savedd.png" className="w-6 h-6 hover:opacity-80 transition" alt="Saved" />
                </button>

                <button onClick={() => reportPost(p._id)} title="Report">
                   <img src="/images/report.png" className="w-6 h-6 opacity-40 hover:opacity-100" alt="Report" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}