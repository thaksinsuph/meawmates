import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSaved } from "../context/SavedContext";
import { getImageUrl } from "../utils/imageHelper"; // 👈 1. Import helper

export default function CardPost({ post, onLike, onReport }) {
  const navigate = useNavigate();
  const { isSaved, toggleSave } = useSaved();

  // รองรับทั้ง _id (MongoDB) และ id (Mock)
  const postId = post._id || post.id;

  // รองรับ author แบบ Object (จาก populate) และ String (จาก Mock)
  const authorName = post.author?.name || post.author || "Unknown";
  const authorAvatar = post.author?.avatar || post.authorAvatar;
  const authorId = post.author?._id || post.authorId;

  // รองรับ image (DB) และ img (Mock)
  const postImage = post.image || post.img;

  const [likeState, setLikeState] = useState({
    liked: !!post.liked,
    // ถ้า likes เป็น array ให้ใช้ length, ถ้าเป็นตัวเลขก็ใช้เลย
    likes: Array.isArray(post.likes) ? post.likes.length : (post.likes || 0)
  });
  
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLike = (e) => {
    e.stopPropagation();
    setLikeState((s) => ({ liked: !s.liked, likes: s.likes + (s.liked ? -1 : 1) }));
    onLike?.(postId);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    toggleSave(post);
  };

  const handleReport = (e) => {
    e.stopPropagation();
    onReport?.(postId);
    setProfileOpen(false);
  };

  const goDetail = () => navigate(`/post/${postId}`);

  const goToProfile = (e) => {
    e.stopPropagation();
    if (authorId) navigate(`/profile/${authorId}`);
  };

  return (
    <div
      className="group rounded-2xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
      onClick={goDetail}
    >
      {/* Post Image */}
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={getImageUrl(postImage)} // ⭐ ใช้ Helper แปลง URL
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition"
          loading="lazy"
          onError={(e) => { e.target.src = "/images/placeholder.png" }} // กันภาพเสีย
        />
      </div>

      <div className="p-4">
        {/* Author Row */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={getImageUrl(authorAvatar)} // ⭐ ใช้ Helper แปลง Avatar
              alt={authorName}
              className="w-9 h-9 rounded-full border object-cover cursor-pointer hover:opacity-90"
              onClick={(e) => {
                e.stopPropagation();
                setProfileOpen((v) => !v);
              }}
            />
            
            {/* Profile Dropdown */}
            {profileOpen && (
              <div
                className="absolute z-20 mt-2 w-40 rounded-xl border bg-white shadow-lg py-2 text-sm animate-fadeIn"
                onMouseLeave={() => setProfileOpen(false)}
                onClick={(e) => e.stopPropagation()}
              >
                {authorId && (
                    <button
                    className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700"
                    onClick={goToProfile}
                    >
                    View Profile
                    </button>
                )}
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert("Chat system coming soon!"); // หรือ navigate ไปหน้า chat
                    setProfileOpen(false);
                  }}
                >
                  Message
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-red-600"
                  onClick={handleReport}
                >
                  Report
                </button>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-medium truncate text-slate-800">{post.title}</div>
            <div className="text-xs text-slate-500 truncate">
                {authorName} • {post.location || "Unknown location"}
            </div>
          </div>

          <span
            className={
              "ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide " +
              (post.status === "paired"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-pink-100 text-pink-700")
            }
          >
            {post.status === "paired" ? "Paired" : "Looking"}
          </span>
        </div>

        <p className="mt-3 text-sm text-slate-600 line-clamp-2 h-10 leading-relaxed">
          {post.snippet || post.content || "No description."}
        </p>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <button
              className="rounded-xl px-3 py-1.5 flex items-center gap-1.5 hover:bg-pink-50 transition text-slate-600 hover:text-pink-500"
              onClick={handleLike}
            >
              <img
                src={likeState.liked ? "/icons/heart-filled.png" : "/icons/heart.png"}
                className="w-4 h-4"
                alt="like"
              />
              <span className="text-xs font-medium">{likeState.likes}</span>
            </button>

            <button
              className="rounded-xl px-3 py-1.5 flex items-center gap-1.5 hover:bg-indigo-50 transition text-slate-600 hover:text-indigo-500"
              onClick={handleSave}
              title={isSaved(postId) ? "Unsave" : "Save"}
            >
              <img
                src={isSaved(postId) ? "/icons/save-filled.png" : "/icons/save.png"}
                className="w-4 h-4"
                alt="save"
              />
              {/* <span className="text-xs font-medium">{isSaved(postId) ? "Saved" : "Save"}</span> */}
            </button>
          </div>

          <button
            className="text-xs font-semibold text-pink-500 hover:text-pink-600 hover:underline px-2"
            onClick={(e) => {
              e.stopPropagation();
              goDetail();
            }}
          >
            Read More →
          </button>
        </div>
      </div>
    </div>
  );
}