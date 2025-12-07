import { useEffect, useState } from "react";
import api from "../api"; 
import { getUser } from "../auth";
import { Link } from "react-router-dom";

export default function Saved() {
  const [posts, setPosts] = useState([]);
  const user = getUser();
  const backendBase = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

  useEffect(() => {
    fetchSaved();
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
      // ลบออกจากรายการทันทีที่กด Unsave
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  /* Helper Functions */
  const imageURL = (img) => {
    if (!img) return "https://placekitten.com/400/300"; 
    if (img.startsWith("data:") || img.startsWith("http")) return img;
    return `${backendBase}${img.startsWith("/") ? img : "/" + img}`;
  };

  const avatarURL = (av) => {
    if (!av) return "/images/profile.png"; 
    // ถ้าเป็นรูป local (เวลา dev) ให้ใช้ได้เลย
    if (av === "/images/profile.png" || av.startsWith("/images/")) return av;
    if (av.startsWith("data:") || av.startsWith("http")) return av;
    return `${backendBase}${av.startsWith("/") ? av : "/" + av}`;
  };

  const isLiked = (p) => p.likes?.includes(user?._id);

  return (
    <div className="max-w-7xl mx-auto py-20 px-6">
      <h1 className="text-2xl font-bold flex items-center gap-3 mb-6 text-gray-800">
        <img src="/images/Savedd.png" className="w-8 h-8" onError={(e) => e.target.style.display='none'} /> 
        Saved Posts
      </h1>

      {posts.length === 0 ? (
        <div className="text-center mt-20 text-gray-400">
            ยังไม่มีโพสต์ที่คุณบันทึกไว้
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {posts.map((p) => (
            <div key={p._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-4 border">
              
              {/* Post Image */}
              <Link to={`/post/${p._id}`}>
                <img
                  src={imageURL(p.image)}
                  className="w-full h-64 object-cover rounded-xl mb-3 bg-gray-100"
                  alt="Post"
                  // ⭐ สำคัญ: ถ้าโหลดรูปไม่ได้ ให้ใช้รูปแมวแทน
                  onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = "https://placekitten.com/400/300";
                  }}
                />
              </Link>

              {/* Content */}
              <p className="text-gray-800 text-sm mb-3 line-clamp-2 min-h-[40px]">
                {p.content || "(No message)"}
              </p>

              <div className="flex justify-between items-center pt-2 border-t">
                {/* Author Info */}
                <div className="flex items-center gap-2">
                  <img
                    src={avatarURL(p.author?.avatar)}
                    className="w-8 h-8 rounded-full border object-cover"
                    // ⭐ สำคัญ: ถ้าโหลด Avatar ไม่ได้ ให้ใช้รูป Default
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/images/profile.png";
                    }}
                  />
                  <span className="font-medium text-gray-700 text-sm">
                      {p.author?.name || "Unknown"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 text-sm items-center">
                  <div className="flex items-center gap-1 text-gray-500">
                    <img src="/images/Like.png" className={`w-5 h-5 ${isLiked(p) ? "opacity-100" : "opacity-50"}`} />
                    {p.likes?.length || 0}
                  </div>
                  
                  <button onClick={() => toggleSave(p._id)}>
                    <img src="/images/Savedd.png" className="w-5 h-5 hover:scale-110 transition" title="Unsave" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}