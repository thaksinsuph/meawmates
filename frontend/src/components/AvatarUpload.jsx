import { useState } from "react";
import api from "../api"; // ตรวจสอบว่า path api ถูกต้องตามเครื่องคุณ

export default function AvatarUpload({ currentAvatar, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // เริ่มอัปโหลดทันทีที่เลือกไฟล์
    setUploading(true);
    const formData = new FormData();
    formData.append("avatar", file); // ชื่อนี้ต้องตรงกับ backend

    try {
      const res = await api.post("/api/users/upload-avatar", formData);
      
      alert("เปลี่ยนรูปโปรไฟล์เรียบร้อย!");
      
      // ส่ง URL ใหม่กลับไปให้หน้าหลักอัปเดต
      if (onUploadSuccess) {
        onUploadSuccess(res.data.url);
      }
    } catch (err) {
      console.error(err);
      alert("อัปโหลดไม่ผ่าน ลองใหม่อีกครั้ง");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* รูปโปรไฟล์ */}
        <img
          src={currentAvatar || "https://via.placeholder.com/150"}
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover border-4 border-pink-200 shadow-lg"
        />
        
        {/* ปุ่มกล้องถ่ายรูปเล็กๆ มุมขวาล่าง */}
        <label className="absolute bottom-0 right-0 bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-full cursor-pointer shadow transition">
          {uploading ? (
            <span className="text-xs">...</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          )}
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>
      {uploading && <p className="text-sm text-pink-500 animate-pulse">กำลังอัปโหลด...</p>}
    </div>
  );
}