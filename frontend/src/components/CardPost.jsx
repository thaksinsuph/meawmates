import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { useSaved } from "../context/SavedContext"

export default function CardPost({ post, onLike, onReport }) {
  const navigate = useNavigate()
  const { isSaved, toggleSave } = useSaved()
  const [likeState, setLikeState] = useState({
    liked: !!post.liked, likes: post.likes || 0
  })
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLike = (e) => {
    e.stopPropagation()
    setLikeState(s => ({ liked: !s.liked, likes: s.likes + (s.liked ? -1 : 1) }))
    onLike?.(post.id)
  }
  const handleSave = (e) => {
    e.stopPropagation()
    toggleSave(post)
  }
  const handleReport = (e) => {
    e.stopPropagation()
    onReport?.(post.id)
    setProfileOpen(false)
  }
  const goDetail = () => navigate(`/post/${post.id}`)

  return (
    <div
      className="group rounded-2xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition"
      onClick={goDetail}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={post.img}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition"
          loading="lazy"
        />
      </div>

      <div className="p-4">
        {/* author row */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={post.authorAvatar}
              alt={post.author}
              className="w-9 h-9 rounded-full border object-cover cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setProfileOpen(v => !v) }}
            />
            {profileOpen && (
              <div
                className="absolute z-20 mt-2 w-40 rounded-xl border bg-white shadow-lg py-2 text-sm"
                onMouseLeave={() => setProfileOpen(false)}
              >
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-slate-100"
                  onClick={(e)=>{ e.stopPropagation(); alert("Open chat with author (mock)"); setProfileOpen(false) }}
                >
                  Message
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-slate-100"
                  onClick={handleReport}
                >
                  Report
                </button>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{post.title}</div>
            <div className="text-xs text-slate-500">{post.author} • {post.location}</div>
          </div>
          <span className={
            "ml-auto text-xs px-2 py-0.5 rounded-full " +
            (post.status === "paired" ? "bg-emerald-50 text-emerald-700" : "bg-pink-50 text-pink-700")
          }>
            {post.status === "paired" ? "Paired" : "Looking"}
          </span>
        </div>

        <p className="mt-3 text-sm text-slate-700 line-clamp-2">{post.snippet}</p>

        {/* actions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl border px-3 h-10 flex items-center gap-2 hover:bg-slate-50"
              onClick={handleLike}
            >
              <img
                src={likeState.liked ? "/icons/heart-filled.png" : "/icons/heart.png"}
                className="w-5 h-5"
                alt="like"
              />
              <span className="text-sm">{likeState.likes}</span>
            </button>

            <button
              className="rounded-xl border px-3 h-10 flex items-center gap-2 hover:bg-slate-50"
              onClick={handleSave}
              title={isSaved(post.id) ? "Unsave" : "Save"}
            >
              <img
                src={isSaved(post.id) ? "/icons/save-filled.png" : "/icons/save.png"}
                className="w-5 h-5"
                alt="save"
              />
              <span className="text-sm">{isSaved(post.id) ? "Saved" : "Save"}</span>
            </button>
          </div>

          <button
            className="rounded-xl border px-3 h-10 flex items-center gap-2 hover:bg-slate-50"
            onClick={(e)=>{ e.stopPropagation(); goDetail() }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  )
}
