import { useEffect, useState } from "react";
import api from "../api";

export default function ManagePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const imageURL = (img) =>
    !img
      ? "https://placekitten.com/300/200"
      : img.startsWith("data:")
      ? img
      : `http://localhost:4000${img.replace(/\\/g, "/")}`;

  const avatarURL = (avatar) =>
    !avatar
      ? "/images/default-cat.png"
      : avatar.startsWith("data:")
      ? avatar
      : `http://localhost:4000${avatar.replace(/\\/g, "/")}`;

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
              {/* รูปโพสต์ */}
              <img
                src={imageURL(p.image)}
                className="w-full h-80 object-cover rounded-xl"
              />

              {/* เนื้อหา */}
              <p className="text-sm text-gray-700 line-clamp-3">
                {p.content || "(no content)"}
              </p>

              {/* Author block */}
              <div className="flex items-center gap-3 mt-2">
                {/* Avatar */}
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

              {/* ปุ่มลบ */}
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
