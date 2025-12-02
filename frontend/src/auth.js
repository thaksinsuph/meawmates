// frontend/src/auth.js

// ----------------------------------------------------
// 🛡 ป้องกัน JSON.parse error
// ----------------------------------------------------
const SAFE_PARSE = (raw) => {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return typeof v === "object" && v !== null ? v : null;
  } catch {
    return null;
  }
};

// ----------------------------------------------------
// 💾 บันทึก Token + User ลง localStorage
// รองรับ response หลายรูปแบบ เช่น
// { token, user }
// { accessToken, profile }
// { data: { token, user } }
// ----------------------------------------------------
export const saveUser = (data) => {
  const token =
    data?.token ||
    data?.accessToken ||
    data?.jwt ||
    data?.authToken ||
    data?.data?.token ||
    "";

  const user =
    data?.user ||
    data?.profile ||
    data?.data?.user ||
    data?.data ||
    null;

  if (!token || !user) {
    console.warn("⚠️ saveUser: Missing token or user in response", data);
    return;
  }

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

// ----------------------------------------------------
// 👤 ดึงข้อมูล User (ถ้า error จะ clear ให้อัตโนมัติ)
// ----------------------------------------------------
export const getUser = () => {
  const raw = localStorage.getItem("user");
  const parsed = SAFE_PARSE(raw);

  if (!parsed) {
    localStorage.removeItem("user");
    return null;
  }

  return parsed;
};

// ----------------------------------------------------
// 🔑 ดึง Token
// ----------------------------------------------------
export const getToken = () => {
  const tk = localStorage.getItem("token");
  return tk && tk !== "undefined" ? tk : "";
};

// ----------------------------------------------------
// 🚪 logout
// ----------------------------------------------------
export const logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};
