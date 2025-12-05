import { useEffect, useState } from "react";
import { saveUser } from "../auth";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";   // ⭐ ใช้ API ที่เชื่อมกับ ENV
                           // baseURL = VITE_API_URL

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ⭐ Detect Google Redirect Token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));

      saveUser({
        token,
        user: {
          _id: payload.id,
          email: payload.email,
          role: payload.role,
          name: payload.name || "Google User"
        }
      });

      navigate("/");
    }
  }, []);

  // ⭐ Normal Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      

      // ✅ ใช้ api.js (ถูก)
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });

      const { token, user } = res.data;
      saveUser({ token, user });

      if (remember) localStorage.setItem("remember", "true");
      else localStorage.removeItem("remember");

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-white via-pink-50/50 to-indigo-50/50 px-4">
      <div className="w-full max-w-md bg-white border rounded-3xl shadow-xl p-8">
        <h1 className="text-2xl font-semibold text-center mb-6 text-slate-800">
          Welcome back to <span className="text-pink-500">Meow Mates</span>
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="border rounded-xl px-4 py-2 focus:ring-2 focus:ring-pink-300"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="border rounded-xl px-4 py-2 w-full pr-12 focus:ring-2 focus:ring-pink-300"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-pink-500 transition"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
                  stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 19c-7 0-11-7-11-7a18.5 18.5 0 014.44-5.94" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
                  stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
              />
              Remember me
            </label>

            <a href="#" className="text-pink-500 hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-pink-500 text-white py-2 rounded-xl hover:bg-pink-600 transition font-semibold disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* SOCIAL LOGIN */}
        <div className="flex flex-col gap-3 mt-6">

          {/* ⭐ Google */}
          <button
            type="button"
            onClick={() =>
              (window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`)
            }
            className="flex items-center justify-center gap-3 border rounded-xl py-2 hover:bg-gray-50 transition"
          >
            <img src="/images/google.png" className="w-5 h-5" />
            <span className="text-sm font-medium text-slate-700">
              Continue with Google
            </span>
          </button>

          {/* ⭐ Facebook */}
          <button
            type="button"
            onClick={() =>
              (window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/facebook`)
            }
            className="flex items-center justify-center gap-3 border rounded-xl py-2 hover:bg-gray-50 transition"
          >
            <img src="/images/facebook.png" className="w-5 h-5" />
            <span className="text-sm font-medium text-slate-700">
              Continue with Facebook
            </span>
          </button>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-pink-500 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </section>
  );
}
