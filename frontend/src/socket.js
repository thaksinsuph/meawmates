// ตัวอย่าง: frontend/src/socket.js หรือจุดที่คุณเรียกใช้ Socket.IO
import { io } from "socket.io-client";

// ⭐ ใช้ URL ของ Backend (Render Service)
const API_BASE_URL = 'https://meowmates.onrender.com'; // หรือดึงจาก .env (VITE_API_BASE_URL)

const socket = io(API_BASE_URL, {
    // 🎯 1. Path ต้องตรงกับ Server
    path: '/socket.io/', 
    
    // 🎯 2. Transports (ช่วยให้เชื่อมต่อเร็วขึ้นและเสถียรขึ้น)
    transports: ['websocket', 'polling'], 
    
    // 🎯 3. ส่ง Cookie/Credential กลับไปด้วย
    withCredentials: true,
});

