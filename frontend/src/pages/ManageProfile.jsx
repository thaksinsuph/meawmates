import { useState } from "react";
import api from "../api";
import { getUser, saveUser } from "../auth";

export default function ManageProfile() {
  const [user, setUser] = useState(getUser());

  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ⭐ Backend base URL
  const backendBase = import.meta.env.VITE_API_URL.replace("/api", "");

  const fixAvatar = (av) => {
    if (!av) return "/images/profile.png";
    if (av.startsWith("data:")) return av;
    if (av.startsWith("http")) return av;
    return `${backendBase}${av.startsWith("/") ? av : "/" + av}`;
  };

  // ==========================
  // 📌 Upload avatar → base64
  // ==========================
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // ==========================
  // 📌 Save changes
  // ==========================
  const handleSave = async () => {
    setMessage("");

    if (newPassword && newPassword !== confirmPassword) {
      return setMessage("❌ รหัสผ่านใหม่ไม่ตรงกัน");
    }

    setLoading(true);
    try {
      const res = await api.put("/api/users/me", {
        name,
        avatar, // สามารถเป็น base64 หรือ URL backend
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      saveUser(res.data, true);
      setUser(res.data);

      setMessage("✅ บันทึกข้อมูลสำเร็จ");
    } catch (err) {
      console.error(err);
      setMessage("❌ ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-pink-50 to-indigo-50 py-10">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Manage Profile
        </h2>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={fixAvatar(avatar)}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border mb-3"
          />

          <label className="cursor-pointer text-sm text-pink-600 font-medium hover:underline">
            เปลี่ยนรูปโปรไฟล์
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600">ชื่อ</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-pink-400 outline-none"
          />
        </div>

        {/* Password Section */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-md font-semibold text-gray-700 mb-2">
            เปลี่ยนรหัสผ่าน
          </h3>

          <input
            type="password"
            placeholder="รหัสผ่านปัจจุบัน"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border rounded-lg p-2 mb-2"
          />

          <input
            type="password"
            placeholder="รหัสผ่านใหม่"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded-lg p-2 mb-2"
          />

          <input
            type="password"
            placeholder="ยืนยันรหัสผ่านใหม่"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded-lg p-2 mb-2"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className={`w-full mt-4 py-2 rounded-lg text-white font-semibold transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-pink-500 hover:bg-pink-600"
          }`}
        >
          {loading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}
      </div>
    </div>
  );
}
