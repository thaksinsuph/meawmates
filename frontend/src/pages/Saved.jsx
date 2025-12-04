import { useEffect, useState } from "react";
import axios from "axios";
import api from "../api";
import { getUser, getToken } from "../auth";
import { Link } from "react-router-dom";

export default function Saved() {
  const [posts, setPosts] = useState([]);
  const user = getUser();

  useEffect(() => {
    if (user?._id) fetchSaved();
  }, [user]);

  const fetchSaved = async () => {
    try {
      const res = await axios.get(
        `http://localhost:4000/api/posts/saved/${user._id}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setPosts(res.data);
    } catch (err) {
      console.error("❌ Fetch saved posts error:", err);
    }
  };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const diff = (Date.now() - date.getTime()) / 1000;

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  /* ❤️ Like */
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

  /* 💾 Save / Unsave */
  const toggleSave = async (id) => {
    try {
      const res = await api.post(`/api/posts/${id}/save`);
      fetchSaved(); // อัปเดต savedCount และลบโพสต์ออกถ้า unsave แล้ว
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  /* 🚩 Report */
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

  const imageURL = (img) =>
    !img
      ? "https://placekitten.com/400/300"
      : img.startsWith("data:")
      ? img
      : `http://localhost:4000${img.replace(/\\/g, "/")}`;

  const avatarURL = (avatar) =>
    !avatar
      ? "https://i.pravatar.cc/40"
      : avatar.startsWith("data:")
      ? avatar
      : `http://localhost:4000${avatar.replace(/\\/g, "/")}`;

  const isLiked = (p) => p.likes?.includes(user?._id);

  return (
    <div className="max-w-7xl mx-auto py-20 px-6">
      {/* Header */}
      <h1 className="text-4xl font-bold flex items-center gap-3 mb-6">
        <img src="/images/Savedd.png" className="w-10 h-10" />
        Saved Posts
      </h1>

      {/* Empty State */}
      {posts.length === 0 && (
        <p className="text-gray-500 text-center mt-10">
          ยังไม่มีโพสต์ที่คุณบันทึกไว้
        </p>
      )}

      {/* Posts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {posts.map((p) => (
          <div
            key={p._id}
            className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-3"
          >
            {/* Post Image */}
            <Link to={`/post/${p._id}`}>
              <img
                src={imageURL(p.image)}
                className="w-full h-64 object-cover rounded-xl mb-3"
              />
            </Link>

            {/* Content */}
            <p className="text-gray-800 text-sm mb-2">
              {p.content || "(No message)"}
            </p>

            <div className="flex justify-between items-center">
              {/* Avatar + Name */}
              <div className="flex items-center gap-2">
                <img
                  src={avatarURL(p.avatar)}
                  className="w-7 h-7 rounded-full border object-cover"
                />
                <div>
                  <p className="font-medium text-gray-700 text-sm">{p.author}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 text-sm items-center">
                {/* ❤️ Like + number */}
                <button
                  onClick={() => toggleLike(p._id)}
                  className="flex items-center gap-1"
                >
                  <img
                    src="/images/Like.png"
                    className={`w-6 h-6 ${
                      isLiked(p) ? "opacity-100 scale-110" : "opacity-40"
                    }`}
                  />
                  <span className="text-gray-700 text-sm">
                    {p.likes?.length || 0}
                  </span>
                </button>

                {/* 💾 Save + number */}
                <button
                  onClick={() => toggleSave(p._id)}
                  className="flex items-center gap-1"
                >
                  <img
                    src="/images/Savedd.png"
                    className="w-6 h-6 opacity-70 hover:opacity-100"
                  />
                  <span className="text-gray-700 text-sm">
                    {p.savedCount ?? "-"}
                  </span>
                </button>

                {/* 🚩 Report */}
                <button onClick={() => reportPost(p._id)}>
                  <img
                    src="/images/report.png"
                    className="w-6 h-6 opacity-70 hover:opacity-100"
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
