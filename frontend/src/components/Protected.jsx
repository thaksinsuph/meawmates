import { Navigate } from "react-router-dom"
import { isAdmin } from "../auth"

export default function Protected({ children, role="admin" }) {
  if (role === "admin" && !isAdmin()) return <Navigate to="/login" replace />
  return children
}
