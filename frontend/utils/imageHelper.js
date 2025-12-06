// frontend/src/utils/imageHelper.js

export const getImageUrl = (path) => {
  // 1. ถ้าไม่มี path หรือเป็นค่าว่าง
  if (!path) return "/images/profile.png"; // รูป Default User
  
  // 2. ถ้าเป็น Base64 หรือ URL เต็ม (Cloudinary / Google / Facebook)
  if (path.startsWith("data:") || path.startsWith("http")) {
    return path;
  }

  // 3. ถ้าเป็นไฟล์จาก Local Server (ของเก่า)
  // ตัด /api ออกจาก VITE_API_URL เพื่อให้ได้ domain หลัก (เช่น http://localhost:5000)
  const backendUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "";
  
  // จัดการเรื่อง Slash (/) ให้ถูกต้อง
  const cleanPath = path.startsWith("/") ? path : "/" + path;
  
  return `${backendUrl}${cleanPath}`;
};

// ฟังก์ชันสำหรับรูปแมว (ถ้าอยากแยก Default)
export const getPetImageUrl = (path) => {
    if (!path) return "/images/cat-default.png"; // หาภาพแมว default มาใส่
    return getImageUrl(path);
}