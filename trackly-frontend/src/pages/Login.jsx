import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "../api/axios";
import useAuthStore from "../store/authStore";

const loginUser = async (credentials) => {
  const { data } = await api.post("/auth/login", credentials);
  return data;
};

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      login(data.user, data.token);
      if (data.user.role === "ADMIN") navigate("/admin");
      else navigate("/dashboard");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    mutation.mutate(form);
  };

  return (
    <div
      className="h-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: "#f9f9fb", fontFamily: "'Inter', sans-serif", color: "#2d3338" }}
    >
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full"
          style={{ background: "#ebeef2", filter: "blur(80px)", opacity: 0.6 }}
        />
        <div
          className="absolute bottom-1/4 -right-12 w-64 h-64 rounded-full"
          style={{ background: "#dde3e9", filter: "blur(80px)", opacity: 0.4 }}
        />
      </div>

      <main className="flex-1 flex items-center justify-center px-6 relative z-10 overflow-hidden">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

          {/* ── Left: Branding ── */}
          <div className="lg:col-span-7 lg:pr-12">
            <div className="mb-6">
              <span
                className="block text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: "#0D9488", letterSpacing: "0.2em" }}
              >
                Issue Management
              </span>

              <h1
                className="font-black tracking-tighter leading-none mb-4"
                style={{ color: "#2d3338", letterSpacing: "-0.04em", fontSize: "3rem" }}
              >
                Resolv
              </h1>

              <div
                className="mb-6"
                style={{ width: "5rem", height: "4px", borderRadius: "9999px", background: "linear-gradient(90deg, #0D9488, #0891b2)" }}
              />

              <p className="text-base leading-relaxed max-w-lg" style={{ color: "#596065" }}>
                Welcome back. Access your dashboard to manage, track, and resolve
                complaints with AI-powered precision and clarity.
              </p>
            </div>

            {/* Decorative image block */}
            <div class="hidden lg:block mt-12">
<div class="rounded-xl overflow-hidden aspect-[16/9] editorial-shadow grayscale hover:grayscale-80 transition-all duration-700">
<img alt="Professional Workspace" class="w-full h-full object-cover" data-alt="minimalist high-end office interior with clean lines, natural wood desk, and soft morning light through large windows" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuv09YsdYBvBfCSFeNDoNk0YkL2xxmlr0Vj7KL4zMeJhIPyl4vER0Z2_Mq9GhVqmcgxPIjf4NuflS2xz6WCTuDyW7GvkxWtSgRbwDeifqePaPZM93b-fGDNQI7-d5CFow1bKhFP7_UaKtwzcUVQu7Pgalhd-wm0YxmgvOn9zSM4rpwXarmYeU8rLT3a7j6uQ1eTtOlgYTpPqYvYmrAq54s9Wy1FlMmgTsC6D7zlNar7j_mam1k4ZDd4hdFomtv_GCI9l9RLpKZeUc"/>
</div>
</div>
</div>

          {/* ── Right: Login card ── */}
          <div className=" lg:col-span-5">
            <div
              className="obsidian-glass rounded-xl p-8 lg:p-12 editorial-shadow border border-white/20"
              style={{
                background: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRadius: "1.5rem",
                boxShadow: "0 20px 40px rgba(45,51,56,0.08)",
                border: "1px solid rgba(255,255,255,0.6)",
              }}
            >
              <div className="mb-7">
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ color: "#2d3338", letterSpacing: "-0.02em" }}
                >
                  Sign In
                </h2>
                <p className="text-sm" style={{ color: "#596065" }}>
                  Please enter your credentials to continue.
                </p>
              </div>

              {error && (
                <div
                  className="mb-5 px-4 py-3 rounded-xl flex items-center gap-3 text-sm"
                  style={{ backgroundColor: "#fee2e2", color: "#752121" }}
                >
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-1.5">
                  <label
                    className="block text-xs font-bold uppercase tracking-widest ml-1"
                    style={{ color: "#596065", letterSpacing: "0.08em" }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="name@company.com"
                    className="w-full h-12 px-5 text-sm transition-all outline-none"
                    style={{
                      borderRadius: "0.75rem",
                      backgroundColor: "#ffffff",
                      border: "2px solid #ebeef2",
                      color: "#2d3338",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#0D9488"}
                    onBlur={(e) => e.target.style.borderColor = "#ebeef2"}
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label
                      className="block text-xs font-bold uppercase tracking-widest"
                      style={{ color: "#596065", letterSpacing: "0.08em" }}
                    >
                      Password
                    </label>
                    <a
                      href="#"
                      className="text-xs font-bold uppercase tracking-widest transition-colors"
                      style={{ color: "#0D9488", letterSpacing: "0.08em" }}
                      onMouseEnter={(e) => e.target.style.color = "#2d3338"}
                      onMouseLeave={(e) => e.target.style.color = "#0D9488"}
                    >
                      Forgot?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full h-12 px-5 pr-12 text-sm transition-all outline-none"
                      style={{
                        borderRadius: "0.75rem",
                        backgroundColor: "#ffffff",
                        border: "2px solid #ebeef2",
                        color: "#2d3338",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#0D9488"}
                      onBlur={(e) => e.target.style.borderColor = "#ebeef2"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: "#757c81" }}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full h-12 font-bold text-base text-white flex items-center justify-center gap-2 transition-all duration-300"
                  style={{
                    borderRadius: "0.75rem",
                    background: mutation.isPending
                      ? "#acb3b8"
                      : "linear-gradient(135deg, #0D9488 0%, #0b7a70 100%)",
                    boxShadow: mutation.isPending ? "none" : "0 8px 30px rgba(13,148,136,0.28)",
                    cursor: mutation.isPending ? "not-allowed" : "pointer",
                    letterSpacing: "-0.01em",
                  }}
                  onMouseEnter={(e) => { if (!mutation.isPending) { e.currentTarget.style.boxShadow = "0 12px 36px rgba(13,148,136,0.38)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(13,148,136,0.28)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  onMouseDown={(e) => { if (!mutation.isPending) e.currentTarget.style.transform = "scale(0.98)"; }}
                  onMouseUp={(e) => { if (!mutation.isPending) e.currentTarget.style.transform = "translateY(-1px)"; }}
                >
                  {mutation.isPending ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    <>
                      Continue to Dashboard
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div
                className="mt-7 pt-6 text-center text-sm"
                style={{ borderTop: "1px solid #ebeef2", color: "#596065" }}
              >
                New to the system?{" "}
                <Link
                  to="/register"
                  className="font-semibold hover:underline underline-offset-4 transition-colors"
                  style={{ color: "#2d3338" }}
                >
                  Create an account
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 w-full border-t"
        style={{ backgroundColor: "#f9f9fb", borderColor: "#dde3e9" }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center py-4 px-8 max-w-6xl mx-auto gap-3">
          <div className="flex items-center gap-3">
            <span className="font-black tracking-tighter text-sm" style={{ color: "#2d3338", letterSpacing: "-0.03em" }}>
              Resolv
            </span>
            <span className="text-xs" style={{ color: "#757c81" }}>
              © 2026 Resolv. All rights reserved.
            </span>
          </div>
          <div className="flex gap-5">
            {["Privacy Policy", "Terms of Service", "Accessibility", "Support"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs transition-colors"
                style={{ color: "#757c81" }}
                onMouseEnter={(e) => e.target.style.color = "#2d3338"}
                onMouseLeave={(e) => e.target.style.color = "#757c81"}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
