import { useEffect, useState } from "react";
import api from "../api";

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    try {
      const res = await api.get("/api/admin/summary");
      setSummary(res.data);
    } catch (err) {
      console.error("Summary error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading) return <p>Loading dashboard…</p>;
  if (!summary) return <p className="text-red-500">Failed to load dashboard data.</p>;

  const cards = [
    {
      icon: "/images/profile.png",
      label: "Total Users",
      value: summary.totalUsers,
      color: "bg-purple-50",
      accent: "text-purple-600",
    },
    {
      icon: "/images/cat.png",
      label: "Total Pets",
      value: summary.totalPets,
      color: "bg-pink-50",
      accent: "text-pink-500",
    },
    {
      icon: "/images/edit.png",
      label: "Total Posts",
      value: summary.totalPosts,
      color: "bg-blue-50",
      accent: "text-blue-500",
    },
  ];

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
        Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`${c.color} rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center`}
          >
            {/* รูปแทน emoji */}
            <img
              src={c.icon}
              alt={c.label}
              className="w-12 h-12 object-contain mb-2 opacity-90"
            />

            <p className="text-sm text-gray-500 mb-1">{c.label}</p>
            <p className={`text-3xl font-extrabold ${c.accent}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-2">Tips 💡</h3>
        <p className="text-sm text-gray-500">
          You can manage users, pets, and posts using the sidebar on the left.
          Keep the community safe and friendly for all MeowMates! 🐱💜
        </p>
      </div>
    </div>
  );
}
