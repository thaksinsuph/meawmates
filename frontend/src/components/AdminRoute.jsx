import { Navigate } from "react-router-dom";
import { getUser } from "../auth";

export default function AdminRoute({ children }) {
  const user = getUser();

  if (!user) return <Navigate to="/login" />;
  if (user.role !== "admin") return <Navigate to="/" />;

  return children;
}
