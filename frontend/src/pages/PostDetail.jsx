import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import { getUser } from "../auth";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comment, setComment] = useState("");
  const [openMenu, setOpenMenu] = useState(false);

  const user = getUser();

  // ⭐ Backend root URL เช่น https://meawmates.onrender.com
  const backendBase = import.meta.env.VITE_API_URL.replace("/api", "");

  /* ------------------------------ TIME AGO ------------------------------ */
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const diff = (Date.now() - date.getTime()) / 1000;

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  /* ------------------------------ FETCH POST ------------------------------ */
  const fetchPost = async () => {
    try {
      const res = await api.get(`/api/posts/${id}`);
      // ต้องตรวจสอบว่าข้อมูลที่ส่งกลับมามี isSaved และ savedCount หรือไม่
      setPost(res.data); 
    } catch (err) {
      console.error("Fetch post error:", err);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  /* ------------------------------ URL HELPERS ------------------------------ */
  const fixURL = (img) => {
    if (!img || typeof img !== "string") return "https://placekitten.com/400/300";
    if (img.startsWith("data:")) return img;
    if (img.startsWith("http")) return img;
    return `${backendBase}${img.startsWith("/") ? img : "/" + img}`;
  };

  const avatarURL = (av) => {
    if (!av) return "/images/profile.png";
    if (av.startsWith("data:")) return av;
    if (av.startsWith("http")) return av;
    if (av.startsWith("/images/")) return av;
    return fixURL(av);
  };

  /* ------------------------------ DELETE POST ------------------------------ */
  const deletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await api.delete(`/api/posts/${id}`);
      alert("Post deleted");
      navigate("/home");
    } catch (err) {
      console.error("Delete post error:", err);
    }
  };

  /* ------------------------------ LIKE ------------------------------ */
  const isLiked = () => post?.likes?.includes(user?._id);

  const toggleLike = async () => {
    try {
      const res = await api.post(`/api/posts/${id}/like`);

      setPost((prev) =>
        prev
          ? {
              ...prev,
              likes:
                res.data.message === "Liked"
                  ? [...prev.likes, user._id]
                  : prev.likes.filter((uid) => uid !== user._id),
            }
          : prev
      );
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  /* ------------------------------ SAVE (แก้ไขแล้ว) ------------------------------ */
  const toggleSave = async () => {
    console.log("Attempting to save post:", id); // ⭐ เพิ่มบรรทัดนี้
    try {
      // 1. เรียก API เพื่อสลับสถานะการบันทึก
      const res = await api.post(`/api/posts/${id}/save`);
      
      // 2. อัปเดต State โดยตรง
      setPost((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isSaved: res.data.saved,       // ✅ อัปเดตสถานะ Save/Unsave
          savedCount: res.data.savedCount, // ✅ อัปเดตตัวนับ
        };
      });

      // ❌ ลบ fetchPost(); ออกไป
      // ❌ ไม่มีคำสั่ง navigate()
      
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  /* ------------------------------ COMMENT ------------------------------ */
  const handleComment = async () => {
    if (!comment.trim()) return;

    try {
      await api.post(`/api/posts/${id}/comment`, { content: comment });
      setComment("");
      fetchPost();
    } catch (err) {
      console.error("Comment error:", err);
    }
  };

  if (!post)
    return <div className="p-10 text-center text-lg">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto py-20 px-4">
      <div className="bg-white rounded-2xl shadow-md p-6">

        {/* AUTHOR + MENU */}
        <div className="relative flex items-center justify-between mb-4">

          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.author?._id}`}>
              <img
                src={avatarURL(post.author?.avatar)}
                className="w-12 h-12 rounded-full border object-cover hover:scale-110 transition"
              />
            </Link>

            <div>
              <Link
                to={`/profile/${post.author?._id}`}
                className="font-semibold text-lg hover:underline"
              >
                {post.author?.name}
              </Link>
              <p className="text-gray-500 text-sm">{timeAgo(post.createdAt)}</p>
            </div>
          </div>

          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="text-2xl text-gray-600 hover:text-gray-800 px-2"
          >
            ⋮
          </button>

          {/* MENU */}
          {openMenu && (
            <div className="absolute right-2 top-12 bg-white shadow-xl border rounded-xl w-64 py-2 z-30 animate-fadeIn">
              
              <button
                onClick={() => {
                  toggleSave();
                  setOpenMenu(false);
                }}
                className="w-full flex gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg"
              >
                <img src="/images/save-menu.png" className="w-5 h-5" />
                <span>{post.isSaved ? "Remove from saved" : "Save post"}</span>
              </button>

              <button
                onClick={() => {
                  const reason = prompt("Reason for reporting this post?");
                  if (reason) api.post(`/api/posts/${id}/report`, { reason });
                  setOpenMenu(false);
                }}
                className="w-full flex gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg"
              >
                <img src="/images/report.png" className="w-5 h-5" />
                <span>Report post</span>
              </button>

              {user?._id === post.author?._id && (
                <button
                  onClick={deletePost}
                  className="w-full flex gap-3 px-4 py-3 hover:bg-red-100 rounded-lg"
                >
                  <img src="/images/delete.png" className="w-5 h-5" />
                  <span className="text-red-600">Delete post</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* IMAGE */}
        <div className="w-full max-h-[550px] overflow-hidden rounded-xl mb-4 flex justify-center bg-gray-100">
          <img
            src={fixURL(post.image)}
            className="max-h-[550px] w-auto object-contain"
          />
        </div>

        {/* CONTENT */}
        <p className="text-gray-700 mb-4">{post.content}</p>

        {/* LIKE + SAVE */}
        <div className="flex gap-10 mb-6 text-lg items-center">
          <button onClick={toggleLike} className="flex items-center gap-2">
            <img
              src="/images/Like.png"
              className={`w-7 h-7 ${
                isLiked() ? "opacity-100 scale-110" : "opacity-40"
              } transition`}
            />
            <span>{post.likes?.length || 0}</span>
          </button>

          <button onClick={toggleSave} className="flex items-center gap-2">
            <img
              src={post.isSaved ? "/images/Savedd.png" : "/images/Saved.png"}
              className="w-7 h-7"
            />
            <span>{post.savedCount ?? 0}</span>
          </button>
        </div>

        {/* COMMENTS */}
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <img src="/images/comments.png" className="w-6 h-6" />
          Comments ({post.comments?.length || 0})
        </h3>

        {post.comments?.length > 0 ? (
          <div className="space-y-3">
            {post.comments.map((c, i) => (
              <CommentItem
                key={i}
                comment={c}
                currentUser={user}
                avatarURL={avatarURL}
                timeAgo={timeAgo}
                onDelete={async (cid) => {
                  await api.delete(`/api/posts/${id}/comment/${cid}`);
                  fetchPost();
                }}
                onReport={async (cid, reason) => {
                  await api.post(`/api/posts/${id}/comment/${cid}/report`, {
                    reason,
                  });
                  alert("Reported");
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No comments yet.</p>
        )}

        {/* ADD COMMENT */}
        {user && (
          <div className="flex gap-2 mt-4">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 border rounded-xl px-3 py-2 text-sm"
              placeholder="Write a comment..."
            />
            <button
              onClick={handleComment}
              className="bg-pink-500 text-white px-4 rounded-xl hover:bg-pink-600"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ COMMENT ITEM ------------------------------ */
function CommentItem({ comment, currentUser, avatarURL, timeAgo, onDelete, onReport }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex gap-3 p-3 bg-gray-50 rounded-xl">

      <Link to={`/profile/${comment.userId}`}>
        <img
          src={avatarURL(comment.avatar)}
          className="w-8 h-8 rounded-full border object-cover hover:opacity-80"
        />
      </Link>

      <div className="flex-1">
        <div className="flex justify-between items-start">
          <Link
            to={`/profile/${comment.userId}`}
            className="font-medium text-gray-800 hover:underline"
          >
            {comment.author}
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="px-2 text-xl text-gray-500 hover:text-gray-700"
          >
            ⋮
          </button>
        </div>

        <p className="text-gray-600">{comment.content}</p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo(comment.date)}</p>
      </div>

      {open && (
        <div className="absolute right-3 top-9 bg-white shadow-xl border rounded-xl w-56 py-2 z-30">

          <button
            onClick={() => {
              const reason = prompt("Why do you want to report this comment?");
              if (!reason) return;
              onReport(comment._id, reason);
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg"
          >
            <img src="/images/report.png" className="w-5 h-5" />
            <span className="text-gray-800 text-sm">Report comment</span>
          </button>

          {currentUser?._id === comment.userId && (
            <button
              onClick={() => {
                onDelete(comment._id);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-100 rounded-lg"
            >
              <img src="/images/delete.png" className="w-5 h-5" />
              <span className="text-red-600 text-sm">Delete comment</span>
            </button>
          )}

        </div>
      )}

    </div>
  );
}