import { io } from "socket.io-client";

// 1. ดึง Base URL ของ Backend (Vite/React จะใช้ VITE_ นำหน้า)
// ค่านี้ควรถูกตั้งใน frontend/.env เป็น VITE_API_BASE_URL=https://meowmates.onrender.com
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://meowmates.onrender.com';

// 🛑 Named Export: ใช้ export const เพื่อให้ Messages.jsx สามารถใช้ import { socket } ได้
export const socket = io(API_BASE_URL, {
    // 🎯 1. Path: ต้องตรงกับ Server.js (โดยลบ Trailing Slash ออกเพื่อแก้ไขปัญหา Proxy/Render)
    path: '/socket.io', 
    
    // 🎯 2. Transports: สำคัญสำหรับ Production/Render เพื่อให้ WebSocket ทำงาน
    transports: ['websocket', 'polling'], 
    
    // 🎯 3. Credentials: ต้องมีเพื่อให้ส่ง Auth Token (Cookie) กลับไปที่ Backend ได้
    withCredentials: true,
    
    // 4. ตั้งค่า Reconnection
    reconnection: true, 
    reconnectionAttempts: 10,
});

// ตรวจสอบการเชื่อมต่อ (สำหรับ Debugging)
socket.on('connect', () => {
    console.log('✅ Socket connected to:', API_BASE_URL);
});

socket.on('disconnect', (reason) => {
    console.warn('❌ Socket disconnected:', reason);
});  