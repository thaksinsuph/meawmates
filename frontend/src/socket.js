// frontend/src/socket.js
import { io } from 'socket.io-client';

// 1. ดึง Base URL ของ Backend (ต้องใช้ VITE_ นำหน้าใน Vite/React)
// *ต้องแน่ใจว่าได้ตั้งค่า VITE_API_BASE_URL ใน .env ของ Frontend แล้ว*
const URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// 2. สร้าง Socket Instance
export const socket = io(URL, {
    // ต้องตั้งค่า withCredentials: true เพื่อให้ส่ง Auth Token (Cookie/JWT) ได้
    withCredentials: true,
    // อนุญาตให้เชื่อมต่อใหม่โดยอัตโนมัติหากหลุด
    reconnection: true, 
    // ถ้าใช้ HTTPS ใน Production (Render) ให้ใช้ transports: ['websocket']
    transports: ['websocket', 'polling'] 
});

// (ไม่จำเป็นต้องมี console.log ใน Production แต่มีไว้สำหรับ Debug ได้)
// socket.on('connect', () => console.log('✅ Socket connected to:', URL));
// socket.on('disconnect', () => console.log('❌ Socket disconnected.'));