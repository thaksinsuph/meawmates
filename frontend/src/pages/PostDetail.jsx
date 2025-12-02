import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import { getUser } from "../auth";

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState("");
  const user = getUser();

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
      setPost(res.data);
    } catch (err) {
      console.error("Fetch post error:", err);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  /* ------------------------------ URL HELPERS ------------------------------ */
  const imageURL = (img) =>
    !img
      ? "https://placekitten.com/400/300"
      : img.startsWith("data:")
      ? img
      : `http://localhost:4000${img.replace(/\\/g, "/")}`;

  const avatarURL = (avatar) =>
    !avatar
      ? "/images/default-avatar.png"
      : avatar.startsWith("data:")
      ? avatar
      : avatar.startsWith("http")
      ? avatar
      : `http://localhost:4000${avatar.replace(/\\/g, "/")}`;

  /* ------------------------------ LIKE SYSTEM = SAME AS HOME ------------------------------ */
  const isLiked = () => post?.likes?.includes(user?._id);

  const toggleLike = async () => {
    try {
      const res = await api.post(`/api/posts/${id}/like`);

      // ⭐ Update real-time แบบหน้า Home
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

  /* ------------------------------ SAVE ------------------------------ */
  const toggleSave = async () => {
    try {
      await api.post(`/api/posts/${id}/save`);
      alert("Saved toggled!");
      fetchPost();
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

  /* ------------------------------ UI ------------------------------ */
  if (!post)
    return <div className="p-10 text-center text-lg">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto py-20 px-4">
      <div className="bg-white rounded-2xl shadow-md p-6">

        {/* IMAGE */}
        <div className="w-full max-h-[550px] overflow-hidden rounded-xl mb-4 flex justify-center bg-gray-100">
          <img
            src={imageURL(post.image)}
            className="max-h-[550px] w-auto object-contain"
          />
        </div>

        {/* AUTHOR */}
        <div className="flex items-center gap-3 mb-3">
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

        {/* CONTENT */}
        <p className="text-gray-700 mb-4">{post.content}</p>

        {/* LIKE + SAVE (เหมือนหน้า HOME 100%) */}
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
            <img src="/images/Saved.png" className="w-7 h-7 opacity-70" />
            <span>{post.savedCount ?? 0}</span>
          </button>
        </div>

        {/* COMMENTS */}
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <img src="/images/comments.png" className="w-6 h-6" />
          Comments
        </h3>

        {post.comments?.length > 0 ? (
          <div className="space-y-3">
            {post.comments.map((c, i) => (
              <div
                key={i}
                className="p-3 bg-gray-50 rounded-xl flex gap-3"
              >
                <img
                  src={avatarURL(c.avatar)}
                  className="w-8 h-8 rounded-full border object-cover"
                />
                <div>
                  <p className="font-medium">{c.author}</p>
                  <p className="text-gray-600">{c.content}</p>
                  <p className="text-xs text-gray-400">{timeAgo(c.date)}</p>
                </div>
              </div>
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
        <div className="absolute right-2 top-10 bg-white border shadow-lg rounded-lg w-32 z-20">
          <button
            onClick={() => {
              const reason = prompt("Why do you want to report this comment?");
              if (!reason) return;
              onReport(comment._id, reason);
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
          >
            🚩 Report
          </button>

          {currentUser?._id === comment.userId && (
            <button
              onClick={() => {
                onDelete(comment._id);
                setOpen(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-red-100 text-sm text-red-600"
            >
              🗑 Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
