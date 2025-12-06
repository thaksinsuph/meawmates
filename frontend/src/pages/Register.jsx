import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api"; // ⭐ ใช้ API ที่มี baseURL จาก ENV

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      
      await api.post("/api/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      alert("🎉 Register success!");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-white via-pink-50/50 to-indigo-50/50 px-4">
      <div className="w-full max-w-md bg-white border rounded-3xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-center mb-6 text-slate-800">
          Join <span className="text-pink-500">Meow Mates</span>
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* NAME */}
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name"
            required
            className="border rounded-xl px-4 py-2 focus:ring-2 focus:ring-pink-300"
          />

          {/* EMAIL */}
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="border rounded-xl px-4 py-2 focus:ring-2 focus:ring-pink-300"
          />

          {/* PASSWORD */}
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="border rounded-xl px-4 py-2 w-full pr-12 focus:ring-2 focus:ring-pink-300"
            />

            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-pink-500 transition"
            >
              {showPass ? (
                // eye-off
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3l18 18M9.9 9.9a3 3 0 014.2 4.2M6.6 6.6A10.8 10.8 0 001.8 12c1.2 3.8 5 7.2 10.2 7.2 2.1 0 4-.6 5.7-1.6" />
                </svg>
              ) : (
                // eye
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="relative">
            <input
              type={showConfirmPass ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              required
              className="border rounded-xl px-4 py-2 w-full pr-12 focus:ring-2 focus:ring-pink-300"
            />

            <button
              type="button"
              onClick={() => setShowConfirmPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-pink-500 transition"
            >
              {showConfirmPass ? (
                // eye-off
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3l18 18M9.9 9.9a3 3 0 014.2 4.2M6.6 6.6A10.8 10.8 0 001.8 12c1.2 3.8 5 7.2 10.2 7.2 2.1 0 4-.6 5.7-1.6" />
                </svg>
              ) : (
                // eye
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* REGISTER BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="bg-pink-500 text-white py-2 rounded-xl hover:bg-pink-600 transition font-semibold disabled:opacity-60"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="px-3 text-slate-400 text-sm">or sign up with</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        {/* SOCIAL LOGIN */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() =>
              (window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`)
            }
            className="flex items-center justify-center gap-3 border rounded-xl py-2 hover:bg-gray-50 transition"
          >
            <img src="/images/google.png" className="w-5 h-5" />
            <span className="text-sm font-medium text-slate-700">Continue with Google</span>
          </button>

          <button
            onClick={() =>
              (window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/facebook`)
            }
            className="flex items-center justify-center gap-3 border rounded-xl py-2 hover:bg-gray-50 transition"
          >
            <img src="/images/facebook.png" className="w-5 h-5" />
            <span className="text-sm font-medium text-slate-700">Continue with Facebook</span>
          </button>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-pink-500 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
