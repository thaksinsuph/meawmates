import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function ManageReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ⭐ Backend Root URL เช่น https://meawmates.onrender.com
  const backendBase = import.meta.env.VITE_API_URL.replace("/api", "");

  const fixURL = (img) => {
    if (!img || typeof img !== "string") return "https://placekitten.com/400/300";
    if (img.startsWith("data:")) return img;
    if (img.startsWith("http")) return img;
    return `${backendBase}${img.startsWith("/") ? img : "/" + img}`;
  };

  /* ------------------ LOAD REPORTS ------------------ */
  const loadReports = async () => {
    try {
      const res = await api.get("/api/admin/reports");
      setReports(res.data);
    } catch (err) {
      console.error("Load reports error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  /* ------------------ DELETE POST ------------------ */
  const deletePost = async (postId, reportId) => {
    if (!confirm("Delete this reported post?")) return;

    try {
      await api.delete(`/api/admin/posts/${postId}`);
      await api.delete(`/api/admin/reports/${reportId}`);

      setReports((prev) => prev.filter((r) => r._id !== reportId));
    } catch (err) {
      console.error("Delete post error:", err);
      alert("Failed to delete post");
    }
  };

  /* ------------------ DELETE COMMENT ------------------ */
  const deleteComment = async (postId, commentId, reportId) => {
    if (!confirm("Delete this comment?")) return;

    try {
      await api.delete(`/api/posts/${postId}/comment/${commentId}`);
      await api.delete(`/api/admin/reports/${reportId}`);

      setReports((prev) => prev.filter((r) => r._id !== reportId));
    } catch (err) {
      console.error("Delete comment error:", err);
      alert("Failed to delete comment");
    }
  };

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold text-purple-600 mb-4 flex items-center gap-2">
        <img src="/images/report.png" className="w-6 h-6" />
        Manage Reports
      </h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading reports…</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-gray-500">No reports found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {reports.map((r) => (
            <div
              key={r._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3"
            >
              {/* TYPE */}
              <span className="px-2 py-1 w-fit bg-red-50 text-red-500 rounded-full text-xs">
                🚨 {r.type.toUpperCase()}
              </span>

              {/* POST REPORT */}
              {r.type === "post" && r.postId && (
                <>
                  <img
                    src={fixURL(r.postId.image)}
                    className="w-full h-60 object-cover rounded-xl"
                  />
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {r.postId.content || "(no content)"}
                  </p>
                </>
              )}

              {/* COMMENT REPORT */}
              {r.type === "comment" && (
                <div className="bg-gray-50 border rounded-xl p-3 text-sm">
                  <p className="font-medium mb-1">Reported Comment:</p>
                  <p className="text-gray-700 italic">“{r.commentText}”</p>
                </div>
              )}

              {/* REPORTER INFO */}
              <div className="bg-purple-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Reporter</p>
                <p className="font-medium text-gray-800">{r.reporter?.name}</p>
                <p className="text-xs text-gray-500">{r.reporter?.email}</p>
              </div>

              {/* REASON */}
              <p className="text-sm text-gray-700 bg-red-50 border border-red-100 rounded-xl p-3">
                <span className="font-medium">Reason:</span> {r.reason}
              </p>

              {/* ACTION BUTTONS */}
              <div className="flex justify-between mt-3">
                {r.type === "post" ? (
                  <button
                    onClick={() => deletePost(r.postId?._id, r._id)}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                  >
                    Delete Post
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      deleteComment(r.postId?._id, r.commentId, r._id)
                    }
                    className="px-3 py-1.5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                  >
                    Delete Comment
                  </button>
                )}

                {r.type === "post" ? (
                  <button
                    onClick={() => navigate(`/post/${r.postId?._id}`)}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-full text-xs hover:bg-blue-600"
                  >
                    View Post
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      navigate(`/post/${r.postId?._id}?highlight=${r.commentId}`)
                    }
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-full text-xs hover:bg-blue-600"
                  >
                    View Comment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
