import { Navigate } from "react-router-dom"
import { getUser } from "../auth"

/**
 * ✅ ProtectedRoute
 * ใช้ครอบหน้าเว็บที่ต้อง login เท่านั้น
 */
export default function ProtectedRoute({ children }) {
  const user = getUser()

  // ถ้ายังไม่ได้ login
  if (!user) {
    alert("Please login first.")
    return <Navigate to="/login" replace />
  }

  // ถ้า login แล้ว → เข้าได้ตามปกติ
  return children
}
