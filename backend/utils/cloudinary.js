// backend/utils/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    // 💡 แนะนำ: อาจเปลี่ยนชื่อโฟลเดอร์เป็น 'meow-mates-chat' เพื่อให้ชัดเจน
    folder: 'meow-mates-avatars', 
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});
   
// สร้าง Multer instance ที่ใช้ CloudinaryStorage และกำหนดขนาดไฟล์สูงสุด 25MB
const upload = multer({ 
  storage: storage,
  limits: {
    fieldSize: 25 * 1024 * 1024 // 25 MB
  }
});

export default upload;