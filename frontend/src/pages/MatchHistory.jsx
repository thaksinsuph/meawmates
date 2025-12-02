import { useEffect, useState } from "react";
import api from "../api";

export default function MatchHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await api.get("/api/matching/history");
    setHistory(res.data || []);
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-pink-500">
        Match History
      </h1>

      {history.map((h) => (
        <div
          key={h._id}
          className="flex items-center gap-4 bg-white shadow p-4 rounded-xl mb-4"
        >
          <img
            src={h.targetCat.image}
            className="w-20 h-20 rounded-xl object-cover"
          />

          <div className="flex-1">
            <h2 className="font-semibold text-lg">{h.targetCat.name}</h2>
            <p className="text-sm text-gray-600">{h.targetCat.breed}</p>
            <p className="text-sm mt-1">
              {h.liked ? "❤️ Liked" : "❌ Disliked"}
            </p>
          </div>

          <div className="text-sm text-gray-400">
            {new Date(h.createdAt).toLocaleString()}
          </div>
        </div>
      ))}

      {history.length === 0 && (
        <p className="text-gray-500 text-center mt-10">
          ไม่มีประวัติการกดเลย 🐱
        </p>
      )}
    </div>
  );
}
