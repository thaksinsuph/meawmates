import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://meowmates.onrender.com';

export const socket = io(API_BASE_URL, {
     
    
    // ⭐ แก้ไขตรงนี้: ให้ตรงกับ Backend และใช้ WebSocket ก่อน
    transports: ['websocket', 'polling'], // <-- เปลี่ยน
    
    withCredentials: true,
    
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

  