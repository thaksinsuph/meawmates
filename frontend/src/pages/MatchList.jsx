import { useEffect, useState } from "react";
import api from "../api";

export default function MatchList() {
  const [matches, setMatches] = useState([]);

  const loadMatches = async () => {
    try {
      const res = await api.get("/api/matching/matches");
      setMatches(res.data || []);
    } catch (err) {
      console.error("Match list error:", err);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  return (
    <div className="w-full flex flex-col items-center py-10 px-4 gap-8">
      <h1 className="text-3xl font-bold">Matched Cats</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {matches.map((cat, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-2xl shadow-md flex flex-col items-center"
          >
            <img
              src={cat.image}
              className="w-40 h-40 object-cover rounded-xl mb-3"
            />
            <p className="font-bold text-xl">{cat.name}</p>
            <p className="text-gray-600">{cat.breed}</p>
            <p className="text-gray-600">{cat.color}</p>

            <button
              onClick={() => (window.location.href = `/chat/${cat.user}`)}
              className="mt-4 bg-pink-500 text-white px-5 py-2 rounded-xl hover:bg-pink-600"
            >
              Chat with Owner
            </button>
          </div>
        ))}

        {matches.length === 0 && (
          <p className="text-gray-500 text-center mt-10">
            No matches yet.
          </p>
        )}
      </div>
    </div>
  );
}
