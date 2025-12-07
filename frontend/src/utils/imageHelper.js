// frontend/src/utils/imageHelper.js

export const getImageUrl = (path) => {
  // 1. ถ้าไม่มี path หรือเป็นค่าว่าง ให้ใช้รูป Default
  if (!path) return "/images/profile.png";

  // ⭐ 2. (สำคัญ) ถ้าเป็นรูปในโฟลเดอร์ public ของ Frontend เอง (/images/...) ให้ใช้ได้เลย ไม่ต้องเติม Backend
  if (path.startsWith("/images/")) {
    return path;
  }
  
  // 3. ถ้าเป็น Base64 หรือ URL เต็มจากภายนอก (Cloudinary / Google / Facebook)
  if (path.startsWith("data:") || path.startsWith("http")) {
    return path;
  }

  // 4. ถ้าเป็นไฟล์จาก Backend (Local Server แบบเก่า)
  // ตัด /api ออกจาก VITE_API_URL เพื่อให้ได้ domain หลัก
  const backendUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "";
  
  // จัดการเรื่อง Slash (/) ให้ถูกต้อง
  const cleanPath = path.startsWith("/") ? path : "/" + path;
  
  return `${backendUrl}${cleanPath}`;
};