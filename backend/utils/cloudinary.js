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
    folder: 'meow-mates-avatars',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});
   
// ⭐ ใช้ตัวนี้ตัวเดียวพอครับ (ที่มี limits)
const upload = multer({ 
  storage: storage,
  limits: {
    fieldSize: 25 * 1024 * 1024 // แก้ปัญหา Field value too long
  }
});

// ❌ ลบบรรทัดนี้ทิ้งไปเลยครับ (มันซ้ำ)
// const upload = multer({ storage: storage });

export default upload;