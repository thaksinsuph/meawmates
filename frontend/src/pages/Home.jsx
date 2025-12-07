// Trigger deploy
import { useEffect, useState } from "react";
import api from "../api.js";
import { getUser } from "../auth";
import { Link } from "react-router-dom";
// 👇 1. Import Helper
import { getImageUrl } from "../utils/imageHelper";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  
  // 👇 2. เพิ่ม State เก็บไฟล์จริง
  const [image, setImage] = useState(null); // สำหรับ Preview (Base64)
  const [imageFile, setImageFile] = useState(null); // สำหรับ Upload (File Object)

  const [showPostBox, setShowPostBox] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const user = getUser();

  /* ------------------ FETCH POSTS ------------------ */
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get("/api/posts");
      setPosts(res.data);
    } catch (err) {
      console.error("❌ Failed to load posts:", err);
    }
  };

  /* ------------------ TIME AGO ------------------ */
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  /* ------------------ IMAGE UPLOAD ------------------ */
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 👇 เก็บไฟล์จริงลง State
      setImageFile(file);

      // สร้าง Preview
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  /* ------------------ CREATE POST (แก้ไข ⭐) ------------------ */
  const handlePost = async () => {
    if (!content && !imageFile) // เช็ค imageFile แทน
      return alert("Please write something or select an image before posting.");

    try {
      // 👇 เปลี่ยนเป็น FormData เพื่อส่งไฟล์ขึ้น Cloudinary
      const formData = new FormData();
      formData.append("content", content);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await api.post("/api/posts", formData);

      // Reset Form
      setContent("");
      setImage(null);
      setImageFile(null);
      setShowPostBox(false);
      fetchPosts();
    } catch (err) {
      alert("❌ Failed to create post: " + (err.response?.data?.message || err.message));
    }
  };

  /* ------------------ LIKE ------------------ */
  const toggleLike = async (id) => {
    try {
      const res = await api.post(`/api/posts/${id}/like`);
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

  /* ------------------ SAVE ------------------ */
  const toggleSave = async (id) => {
    console.log("Attempting to save post:", id); // ⭐ เพิ่มบรรทัดนี้
    try {
      const res = await api.post(`/api/posts/${id}/save`);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === id
            ? {
                ...p,
                isSaved: res.data.saved,
                savedCount: res.data.savedCount,
              }
            : p
        )
      );
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  /* ------------------ REPORT ------------------ */
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

  /* ------------------ DELETE POST ------------------ */
  const deletePost = async (id) => {
    if (!confirm("Do you really want to delete this post?")) return;
    try {
      await api.delete(`/api/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const isLiked = (p) => p.likes?.includes(user?._id);

  return (
    <div className="max-w-7xl mx-auto py-20 px-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <img src="/images/paw-decor.png" className="w-7 h-7" />
        Meow Posts
      </h1>

      {/* ------------------ POST BOX ------------------ */}
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
                  src={getImageUrl(user.avatar)} // ⭐ ใช้ Helper
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
                      setImageFile(null);
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

      {/* ------------------ POSTS LIST ------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {posts.map((p) => (
          <div key={p._id} className="relative bg-white rounded-2xl shadow-md hover:shadow-lg transition p-3">
            
            {p.image && (
  <Link to={`/post/${p._id}`}>
    <img
      src={getImageUrl(p.image)}
      className="w-full h-64 object-cover rounded-xl mb-3 border"
      onError={(e) => { e.target.style.display = 'none' }} // ถ้าโหลดไม่ได้ให้ซ่อน
    />
  </Link>
)}

            <p className="text-gray-800 text-sm mb-2 line-clamp-2">{p.content}</p>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Link to={`/profile/${p.author?._id}`}>
                  <img
                    src={getImageUrl(p.author?.avatar)} // ⭐ ใช้ Helper
                    className="w-7 h-7 rounded-full border object-cover cursor-pointer hover:scale-110 transition"
                  />
                </Link>
                <div>
                  <p className="font-medium text-gray-700 text-sm truncate w-20">{p.author?.name}</p>
                  <p className="text-xs text-gray-500">{timeAgo(p.createdAt)}</p>
                </div>
              </div>

              <div className="flex gap-4 text-sm items-center">

                <button onClick={() => toggleLike(p._id)} className="flex items-center gap-1">
                  <img
                    src="/images/Like.png"
                    className={`w-6 h-6 ${isLiked(p) ? "opacity-100 scale-110" : "opacity-40"}`}
                  />
                  <span>{p.likes?.length || 0}</span>
                </button>

                <Link to={`/post/${p._id}`} className="flex items-center gap-1">
                  <img src="/images/comment-icon.png" className="w-6 h-6 opacity-70" /> 
                  <span>{p.comments?.length || 0}</span>
                </Link>

                <button onClick={() => toggleSave(p._id)} className="flex items-center gap-1">
                  <img
                    src={p.isSaved ? "/images/Savedd.png" : "/images/Saved.png"}
                    className="w-6 h-6 transition-all"
                  />
                  <span>{p.savedCount || 0}</span>
                </button>

                <button
                  onClick={() => setOpenMenu(openMenu === p._id ? null : p._id)}
                  className="text-2xl text-gray-500 hover:text-gray-700"
                >
                  ⋮
                </button>

                {openMenu === p._id && (
                  <div className="absolute right-3 top-10 bg-white shadow-xl border border-gray-200 rounded-xl w-64 py-2 z-30 animate-fadeIn">
                    
                    <button
                      onClick={() => {
                        toggleSave(p._id);
                        setOpenMenu(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all rounded-lg"
                    >
                      <img src="/images/save-menu.png" className="w-5 h-5 opacity-70" />
                      <span className="text-gray-800 text-sm">
                        {p.isSaved ? "Remove from saved" : "Save post"}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        reportPost(p._id);
                        setOpenMenu(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-all rounded-lg"
                    >
                      <img src="/images/report.png" className="w-5 h-5 opacity-70" />
                      <span className="text-gray-800 text-sm">Report post</span>
                    </button>

                    {user?._id === p.author?._id && (
                      <button
                        onClick={() => {
                          deletePost(p._id);
                          setOpenMenu(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-100 transition-all rounded-lg"
                      >
                        <img src="/images/delete.png" className="w-5 h-5 opacity-70" />
                        <span className="text-red-600 text-sm">Delete post</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}