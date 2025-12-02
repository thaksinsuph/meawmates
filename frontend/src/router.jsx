import { createBrowserRouter } from "react-router-dom";

// Layout
import Layout from "./components/Layout";

// User Pages
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ManagePet from "./pages/ManagePet";
import MatchList from "./pages/MatchList";
import MatchHistory from "./pages/MatchHistory";
import Matching from "./pages/Matching";
import SwipeMatch from "./pages/SwipeMatch";
import Messages from "./pages/Messages";
import Saved from "./pages/Saved";
import PostDetail from "./pages/PostDetail";
import ViewProfile from "./pages/Viewprofile";
import NotFound from "./pages/NotFound";

// ⭐ Admin Components + Pages
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import ManageUsers from "./pages/ManageUsers";
import ManagePetsAdmin from "./pages/ManagePetsAdmin";
import ManagePosts from "./pages/ManagePosts";

// Route Protection
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Landing /> },

      // ============================  
      // 🔒 USER ROUTES (Protected)
      // ============================
      {
        path: "home",
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },

      {
        path: "manage-pet",
        element: (
          <ProtectedRoute>
            <ManagePet />
          </ProtectedRoute>
        ),
      },

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

      { path: "profile/:id", element: <ViewProfile /> },

      // ==============================  
      // ⭐ ADMIN ROUTES (PROTECTED)
      // ==============================
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
        ],
      },

      // ============================  
      // 🌐 PUBLIC ROUTES
      // ============================
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "post/:id", element: <PostDetail /> },
      { path: "saved", element: <Saved /> },

      // ============================  
      // ❌ 404
      // ============================
      { path: "*", element: <NotFound /> },
    ],
  },
]);
