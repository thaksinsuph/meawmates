import { useEffect, useState } from "react";
import api from "../api";

export default function ManagePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⭐ backend base URL (Render)
  const backendBase = import.meta.env.VITE_API_URL.replace("/api", "");

  // ⭐ Helper: fix image path
  const fixURL = (img) => {
    if (!img) return "https://placekitten.com/300/200";
    if (img.startsWith("data:")) return img;     // base64
    if (img.startsWith("http")) return img;      // google or web
    return `${backendBase}${img.startsWith("/") ? img : "/" + img}`;
  };

  const avatarURL = (avatar) => {
    if (!avatar) return "/images/profile.png";
    if (avatar.startsWith("/images/")) return avatar;
    if (avatar.startsWith("data:")) return avatar;
    if (avatar.startsWith("http")) return avatar;
    return fixURL(avatar);
  };

  const loadPosts = async () => {
    try {
      const res = await api.get("/api/admin/posts");
      setPosts(res.data);
    } catch (err) {
      console.error("Posts load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id) => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/api/admin/posts/${id}`);
      loadPosts();
    } catch (err) {
      console.error("Delete post error:", err);
      alert("Failed to delete post");
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold text-purple-600 mb-4 flex items-center gap-2">
        <img src="/images/edit.png" className="w-6 h-6 object-contain" />
        Manage Posts
      </h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading posts…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-gray-500">No posts found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {posts.map((p) => (
            <div
              key={p._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3"
            >
              {/* Post Image */}
              <img
                src={fixURL(p.image)}
                className="w-full h-80 object-cover rounded-xl"
              />

              {/* Text */}
              <p className="text-sm text-gray-700 line-clamp-3">
                {p.content || "(no content)"}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 mt-2">
                <img
                  src={avatarURL(p.author?.avatar)}
                  className="w-10 h-10 rounded-full object-cover border shadow-sm bg-purple-100"
                />

                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    {p.author?.name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">{p.author?.email}</p>
                </div>
              </div>

              {/* Likes */}
              <span className="px-2 py-1 w-fit bg-pink-50 text-pink-500 rounded-full text-xs">
                ❤️ {p.likes?.length || 0} likes
              </span>

              {/* Delete Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => deletePost(p._id)}
                  className="px-3 py-1.5 rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
