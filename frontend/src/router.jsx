import { createBrowserRouter } from "react-router-dom";

// Layout
import Layout from "./components/Layout";

// User Pages
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ManagePet from "./pages/ManagePet"; // ยังคง import
import MatchList from "./pages/MatchList";
import MatchHistory from "./pages/MatchHistory";
import Matching from "./pages/Matching";
import SwipeMatch from "./pages/SwipeMatch";
import Messages from "./pages/Messages";
import Saved from "./pages/Saved";
import PostDetail from "./pages/PostDetail";
import ViewProfile from "./pages/ViewProfile";
import NotFound from "./pages/NotFound";

// Admin
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import ManageUsers from "./pages/ManageUsers";
import ManagePetsAdmin from "./pages/ManagePetsAdmin";
import ManagePosts from "./pages/ManagePosts";
import ManageReports from "./pages/ManageReports";


// Route Protection
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
    
    // ============================
    // 🔒 USER ROUTES (Standalone - ไม่มี Layout)
    // ============================
    { // ⭐ เพิ่ม Route /manage-pet ตรงนี้
        path: "manage-pet",
        element: (
            <ProtectedRoute>
                <ManagePet />
            </ProtectedRoute>
        ),
    },

    // ============================
    // 🌐 PUBLIC/USER ROUTES (มี Layout)
    // ============================
    {
        path: "/",
        element: <Layout />,
        children: [
            // ============================
            // 🌐 PUBLIC ROUTES (ไม่ต้องล็อกอิน)
            // ============================
            { index: true, element: <Landing /> },
            { path: "home", element: <Home /> },
            { path: "post/:id", element: <PostDetail /> },

            { path: "login", element: <Login /> },
            { path: "register", element: <Register /> },

            // ============================
            // 🔒 USER ROUTES (ต้องล็อกอิน)
            // ============================
            // ❌ ได้นำ /manage-pet ออกจากส่วนนี้แล้ว
            
            {
                path: "matching",
                element: (
                    <ProtectedRoute>
                        <Matching />
                    </ProtectedRoute>
                ),
            },

            {
                path: "matching/swipe",
                element: (
                    <ProtectedRoute>
                        <SwipeMatch />
                    </ProtectedRoute>
                ),
            },
            
            // ... (Routes อื่นๆ ของ User ที่ต้องการ Layout)
            {
                path: "match-history",
                element: (
                    <ProtectedRoute>
                        <MatchHistory />
                    </ProtectedRoute>
                ),
            },

            {
                path: "matches",
                element: (
                    <ProtectedRoute>
                        <MatchList />
                    </ProtectedRoute>
                ),
            },

            {
                path: "messages",
                element: (
                    <ProtectedRoute>
                        <Messages />
                    </ProtectedRoute>
                ),
            },

            {
                path: "messages/:id",
                element: (
                    <ProtectedRoute>
                        <Messages />
                    </ProtectedRoute>
                ),
            },

            {
                path: "saved",
                element: (
                    <ProtectedRoute>
                        <Saved />
                    </ProtectedRoute>
                ),
            },

            {
                path: "profile/:id",
                element: (
                    <ProtectedRoute>
                        <ViewProfile />
                    </ProtectedRoute>
                ),
            },

            // ============================
            // ⭐ ADMIN ROUTES
            // ============================
            {
                path: "admin",
                element: (
                    <AdminRoute>
                        <AdminLayout />
                    </AdminRoute>
                ),
                children: [
                    { index: true, element: <AdminDashboard /> },
                    { path: "users", element: <ManageUsers /> },
                    { path: "pets", element: <ManagePetsAdmin /> },
                    { path: "posts", element: <ManagePosts /> },
                    { path: "reports", element: <ManageReports /> },
                ],
            },

            // ============================
            // ❌ 404
            // ============================
            { path: "*", element: <NotFound /> },
        ],
    },
]);