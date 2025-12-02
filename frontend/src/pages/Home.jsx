import { useEffect, useState } from "react";
import api from "../api.js";
import { getUser } from "../auth";
import { Link } from "react-router-dom";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [showPostBox, setShowPostBox] = useState(false);

  const user = getUser();

  useEffect(() => {
    fetchPosts();
  }, []);

  // ✅ ใช้ API แบบเดิม
  const fetchPosts = async () => {
    try {
      const res = await api.get("/api/posts");
      setPosts(res.data);
    } catch (err) {
      console.error("❌ Failed to load posts:", err);
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

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!content && !image)
      return alert("Please write something or select an image before posting.");

    try {
      await api.post("/api/posts", { content, image });
      setContent("");
      setImage(null);
      setShowPostBox(false);
      fetchPosts();
    } catch (err) {
      alert("❌ Failed to create post: " + err.message);
    }
  };

  const toggleLike = async (id) => {
    try {
      // ⭐ endpoint แบบเดิม
      const res = await api.post(`/api/posts/${id}/like`);
      const { liked } = res.data;
      setPosts((prev) =>
      prev.map((p) =>
        p._id === id
          ? {
              ...p,
              likes:
                res.data.message === "Liked"
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
      const res = await api.post(`/api/posts/${id}/save`);
      alert(res.data.saved ? "Post saved!" : "Removed from saved posts!");
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const reportPost = async (id) => {
    const reason = prompt("Reason for reporting this post?");
    if (!reason) return;

    try {
      await api.post(`/api/posts/${id}/report`, { reason });
      alert("Report submitted.");
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
      
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <img src="/images/paw-decor.png" className="w-7 h-7" />
        Meow Posts
      </h1>

      {/* Post Box */}
      {user && (
        <div className="bg-white p-4 rounded-2xl shadow-md mb-10">
          {!showPostBox ? (
            <button
              onClick={() => setShowPostBox(true)}
              className="w-full text-left px-4 py-3 border rounded-xl text-gray-500 hover:bg-gray-50 flex items-center gap-2"
            >
              <img src="/images/edit.png" className="w-5 h-5" />
              What's on your mind?
            </button>
          ) : (
            <div>
              <div className="flex gap-3">
                <img
                  src={avatarURL(user.avatar)}
                  className="w-10 h-10 rounded-full border object-cover"
                />

                <textarea
                  className="flex-1 border rounded-xl p-3 text-sm focus:ring-2 focus:ring-pink-300"
                  placeholder="Write your post here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                />
              </div>

              {image && (
                <img
                  src={image}
                  className="w-full h-60 object-cover rounded-xl mt-3 border"
                />
              )}

              <div className="mt-3 flex items-center justify-between">

                <label className="cursor-pointer flex items-center gap-2 text-sm text-pink-600 font-medium hover:underline">
                  <img src="/images/pictures.png" className="w-5 h-5" />
                  Select Image
                  <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
                </label>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPostBox(false);
                      setContent("");
                      setImage(null);
                    }}
                    className="px-4 py-2 rounded-xl border text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handlePost}
                    className="px-4 py-2 rounded-xl bg-pink-500 text-white font-semibold hover:bg-pink-600"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Posts List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {posts.map((p) => (
          <div key={p._id} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-3">

            <Link to={`/post/${p._id}`}>
              <img
                src={imageURL(p.image)}
                className="w-full h-64 object-cover rounded-xl mb-3"
              />
            </Link>

            <p className="text-gray-800 text-sm mb-2">{p.content}</p>

            <div className="flex justify-between items-center">

              <div className="flex items-center gap-2">
              <Link to={`/profile/${p.author?._id}`}>
                <img
                  src={avatarURL(p.author?.avatar)}
                  className="w-7 h-7 rounded-full border object-cover cursor-pointer hover:scale-110 transition"
                />
              </Link>
                <div>

                  <p className="font-medium text-gray-700 text-sm">{p.author?.name}</p>
                  <p className="text-xs text-gray-500">{timeAgo(p.createdAt)}</p>
                </div>
              </div>

              <div className="flex gap-4 text-sm items-center">
                <button onClick={() => toggleLike(p._id)} className="flex items-center gap-1">
                  <img
                    src="/images/Like.png"
                    className={`w-6 h-6 ${
                      isLiked(p) ? "opacity-100 scale-110" : "opacity-40"
                    }`}
                  />
                  <span className="text-gray-700 text-sm">{p.likes?.length || 0}</span>
                </button>

                <button onClick={() => toggleSave(p._id)} className="flex items-center gap-1">
                  <img src="/images/Saved.png" className="w-6 h-6 opacity-70 hover:opacity-100" />
                  <span className="text-gray-700 text-sm">{p.savedCount ?? "-"}</span>
                </button>

                <button onClick={() => reportPost(p._id)}>
                  <img src="/images/report.png" className="w-6 h-6 opacity-70 hover:opacity-100" />
                </button>
              </div>

            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
