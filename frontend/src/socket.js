// frontend/src/socket.js

import { io } from "socket.io-client";

// 1. ดึง Base URL ของ Backend (ใช้ VITE_API_BASE_URL จาก Frontend .env)
// ให้ใช้ import.meta.env.VITE_API_BASE_URL เพื่อให้ Vite อ่าน Environment Variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://meowmates.onrender.com';

// 🛑 การแก้ไขที่สำคัญที่สุด: ใช้ export const เพื่อให้ตรงกับ Named Import ใน Messages.jsx
export const socket = io(API_BASE_URL, {
    // 🎯 1. Path ต้องตรงกับ Server (Render/Express Server.js)
    path: '/socket.io/', 
    
    // 🎯 2. Transports: สำคัญสำหรับ Render
    transports: ['websocket', 'polling'], 
    
    // 🎯 3. ส่ง Cookie/Credential กลับไปด้วย (ถ้าใช้ JWT ใน Cookie)
    withCredentials: true,
});

// ❌ โค้ดด้านบนทำงานได้โดยไม่ต้องมี export default