import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { getUser, saveUser, logout, getToken } from "../auth";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(() => getUser());
  const location = useLocation();
  const profileRef = useRef();

  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const notiRef = useRef();

  /* LOAD USER */
  useEffect(() => {
    const fetchUser = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const res = await axios.get("http://localhost:4000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        saveUser({ user: res.data, token });
        setUser(res.data);
      } catch {
        logout();
      }
    };

    fetchUser();
  }, [location]);

  /* LOAD NOTIFICATIONS */
  useEffect(() => {
    if (!user?._id) return;

    const loadNoti = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/api/users/me/notifications",
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );

        setNotifications(res.data || []);
        setUnseenCount(res.data.filter((n) => !n.read).length);
      } catch (err) {
        console.error("Load notifications error:", err);
      }
    };

    loadNoti();
  }, [user?._id]);

  /* MARK SEEN */
  const toggleNoti = async () => {
    const newState = !notiOpen;
    setNotiOpen(newState);

    if (!notiOpen) {
      await axios.post(
        "http://localhost:4000/api/users/me/notifications/read",
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setUnseenCount(0);
    }
  };

  /* CLEAR ALL NOTIFICATIONS */
  const handleClearNoti = async (e) => {
    e.stopPropagation();

    await axios.post(
      "http://localhost:4000/api/users/me/notifications/clear",
      {},
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );

    setNotifications([]);
    setUnseenCount(0);
  };

  /* CLOSE MENUS WHEN CLICK OUTSIDE */
  useEffect(() => {
    const handleClick = (e) => {
      if (!profileRef.current?.contains(e.target)) setProfileOpen(false);
      if (!notiRef.current?.contains(e.target)) setNotiOpen(false);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  /* AUTO LOGOUT */
  useEffect(() => {
    const timer = setInterval(() => {
      if (!getUser()) {
        logout();
        window.location.href = "/login";
      }
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  /* SYNC BETWEEN TABS */
  useEffect(() => {
    const syncUser = () => setUser(getUser());
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const fixAvatar = (av) => {
    if (!av) return "/images/default-avatar.png";
    if (av.startsWith("http")) return av;
    if (av.startsWith("data:")) return av;
    return `http://localhost:4000${av.startsWith("/") ? av : "/" + av}`;
  };

  const avatarSrc = fixAvatar(user?.avatar);

  const handleNotiClick = (n) => {
    setNotiOpen(false);
    if (n.type === "like" || n.type === "comment") {
      window.location.href = `/post/${n.postId}`;
    }
    if (n.type === "follow") {
      window.location.href = `/profile/${n.fromUser._id}`;
    }
  };

  return (
    <div
      className="
        min-h-screen flex flex-col relative
        bg-[#fdf9ff]
        
      "
    >

      {/* 🌸 Soft Light Background Blobs */}
      <div className="absolute top-[-15%] left-[-15%] w-[460px] h-[460px] bg-pink-300/30 rounded-full blur-[140px]"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[520px] h-[520px] bg-indigo-300/30 rounded-full blur-[150px]"></div>
      <div className="absolute top-[45%] right-[20%] w-[300px] h-[300px] bg-purple-300/20 rounded-full blur-[170px]"></div>


      {/* NAVBAR */}
      <header className="border-b bg-white/80 backdrop-blur-md fixed top-0 left-0 w-full z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-800">
            <img src="/images/paw-decor.png" className="w-7 h-7" />
            Meow Mates
          </Link>

          {/* NAV LINKS */}
          <nav className="flex items-center gap-6 text-slate-700">
            <NavLink to="/home">Home</NavLink>
            <NavLink to="/matching">Matching</NavLink>
            <NavLink to="/messages">Chat</NavLink>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="px-4 py-2 bg-indigo-500 rounded-xl text-white"
              >
                Menu ▾
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border bg-white shadow-lg py-2 text-sm">
                  <Link to="/manage-pet" onClick={() => setMenuOpen(false)} className="flex gap-2 px-4 py-2 hover:bg-slate-100">
                    <img src="/images/cat.png" className="w-5 h-5" /> Manage Pet
                  </Link>

                  <Link to="/saved" onClick={() => setMenuOpen(false)} className="flex gap-2 px-4 py-2 hover:bg-slate-100">
                    <img src="/images/Saved.png" className="w-5 h-5" /> Saved Posts
                  </Link>

                  <Link to="/match-history" onClick={() => setMenuOpen(false)} className="flex gap-2 px-4 py-2 hover:bg-slate-100">
                    <img src="/images/history.png" className="w-5 h-5" /> Match History
                  </Link>

                  {user?.role === "admin" && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex gap-2 px-4 py-2 hover:bg-slate-100 text-red-600">
                      <img src="/images/admin.png" className="w-5 h-5" /> Admin Dashboard
                    </Link>
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4 relative" ref={profileRef}>

            {/* NOTIFICATIONS */}
            {user && (
              <div className="relative" ref={notiRef}>
                <button onClick={toggleNoti} className="relative">
                  <img src="/images/bell.png" className="w-7 h-7 opacity-80 hover:opacity-100" />
                  {unseenCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {unseenCount}
                    </span>
                  )}
                </button>

                {/* DROPDOWN */}
                {notiOpen && (
                  <div
                    className="absolute right-0 mt-3 w-80 rounded-xl border bg-white shadow-xl z-30 animate-fadeIn"
                    style={{
                      maxHeight: "420px",
                      overflowY: "auto",
                      overflowX: "hidden",
                    }}
                  >
                    <div className="sticky top-0 bg-white border-b px-4 py-2 flex items-center justify-between">
                      <span className="font-semibold text-gray-700">Notifications</span>

                      {notifications.length > 0 && (
                        <button
                          onClick={handleClearNoti}
                          className="text-xs text-pink-600 hover:text-pink-700 hover:underline"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <p className="text-gray-400 text-center py-4 text-sm">No notifications</p>
                    ) : (
                      notifications.map((n, i) => (
                        <div
                          key={i}
                          onClick={() => handleNotiClick(n)}
                          className="flex gap-3 px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition"
                        >
                          <img
                            src={fixAvatar(n?.fromUser?.avatar)}
                            className="w-10 h-10 rounded-full object-cover border"
                          />

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">
                              {n?.fromUser?.name}
                            </p>

                            <p className="text-sm text-gray-700 truncate">
                              {n.message}
                            </p>

                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>

                          <div className="flex items-center pl-1">
                            {n.type === "like" && <span className="text-red-500 text-lg">❤️</span>}
                            {n.type === "comment" && <span className="text-blue-500 text-lg">💬</span>}
                            {n.type === "follow" && <span className="text-pink-500 text-lg">🐾</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PROFILE DROPDOWN */}
            {user ? (
              <>
                <button
                  className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-slate-100"
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <img src={avatarSrc} className="w-9 h-9 rounded-full border object-cover" />
                  <span className="font-medium">{user.name}</span>
                  <span className="text-slate-500">▾</span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 w-44 rounded-xl border bg-white shadow-lg py-2 text-sm">
                    <Link
                      to={`/profile/${user._id}`}
                      className="flex gap-2 px-4 py-2 hover:bg-slate-100"
                      onClick={() => setProfileOpen(false)}
                    >
                      <img src="/images/User.png" className="w-5 h-5 opacity-70" />
                      View My Profile
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex gap-2 px-4 py-2 hover:bg-slate-100 text-red-600"
                    >
                      <img src="/images/logout.png" className="w-5 h-5" />
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" className="px-4 py-2 border text-pink-600 hover:bg-pink-50 rounded-xl">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 bg-pink-500 text-white hover:bg-pink-600 rounded-xl">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main className="flex-1 pt-16 bg-transparent">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="border-t bg-white text-center text-sm text-slate-500 py-6">
        © 2025 Meow Mates. Made with ❤️ for cats everywhere.
      </footer>
    </div>
  );
}
