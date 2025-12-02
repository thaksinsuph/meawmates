import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Content */}
      <div className="flex-1 p-6 md:p-8">
        {/* Top bar / header */}
        <div className="bg-white shadow-sm rounded-2xl px-5 py-4 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-purple-600">
              🐱 MeowMates Admin Panel
            </h1>
            <p className="text-sm text-gray-500">
              Manage users, pets, and posts in a cute & comfy view.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 text-sm text-gray-500">
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
              Admin
            </span>
          </div>
        </div>

        {/* Main content (children routes) */}
        <Outlet />
      </div>
    </div>
  );
}
