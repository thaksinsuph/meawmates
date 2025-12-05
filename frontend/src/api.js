// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,   // ⭐ ใช้ ENV (Netlify)
  withCredentials: true,                   // ⭐ จำเป็นสำหรับ JWT/OAuth Cookies
});

// ⭐ แนบ JWT ทุก req
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
