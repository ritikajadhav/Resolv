import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "../api/axios";
import useAuthStore from "../store/authStore";

const registerUser = async (credentials) => {
  const { data } = await api.post("/auth/register", credentials);
  return data;
};

export default function Register() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [form, setForm] = useState({ name: "", lastName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      login(data.user, data.token);
      navigate("/dashboard");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    mutation.mutate({ name: form.name, lastName: form.lastName, email: form.email, password: form.password });
  };

  const inputStyle = {
    width: "100%", height: "3rem", padding: "0 1.25rem",
    borderRadius: "0.5rem", backgroundColor: "#f2f4f6",
    border: "none", outline: "none",
    fontSize: "0.875rem", color: "#2d3338", transition: "box-shadow 0.2s",
  };

  const labelStyle = {
    fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.1em", color: "#596065", marginLeft: "0.25rem",
  };

  const fieldStyle = { display: "flex", flexDirection: "column", gap: "0.4rem" };

  return (
    <div
      className="h-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: "#f9f9fb", color: "#2d3338", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute rounded-full"
          style={{ top: "-6rem", left: "-6rem", width: "24rem", height: "24rem", backgroundColor: "#ebeef2", filter: "blur(64px)", opacity: 0.5 }}
        />
        <div
          className="absolute rounded-full"
          style={{ bottom: "-12rem", right: "-6rem", width: "32rem", height: "32rem", backgroundColor: "#e3e2e7", filter: "blur(64px)", opacity: 0.3 }}
        />
      </div>

      <main className="flex-1 flex items-center justify-center px-6 relative z-10 overflow-hidden">
        <div
          className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden"
          style={{
            borderRadius: "1rem",
            boxShadow: "0 20px 40px rgba(45,51,56,0.06)",
            backgroundColor: "#ffffff",
          }}
        >

          {/* ── LEFT ── */}
          <div
            className="hidden lg:flex flex-col justify-between relative overflow-hidden"
            style={{ backgroundColor: "#f2f4f6", padding: "3rem" }}
          >
            <div
              className="absolute rounded-full"
              style={{ right: "-5rem", bottom: "-5rem", width: "20rem", height: "20rem", border: "32px solid #ebeef2", opacity: 0.2 }}
            />

            <div className="z-10">
              <h1
                className="font-black tracking-tighter"
                style={{ fontSize: "1.5rem", color: "#2d3338", letterSpacing: "-0.04em", marginBottom: "2.5rem" }}
              >
                Resolv
              </h1>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h2
                  className="font-extrabold tracking-tight"
                  style={{ fontSize: "2.5rem", lineHeight: 1.1, color: "#2d3338", letterSpacing: "-0.03em" }}
                >
                  Report issues.<br />
                  Get them{" "}
                  <span style={{ color: "#757c81" }}>resolved.</span>
                </h2>
                <p style={{ fontSize: "1rem", color: "#596065", maxWidth: "28rem", lineHeight: 1.6 }}>
                  Submit complaints, track their progress in real time, and get
                  notified the moment your issue is resolved — all in one place.
                </p>
              </div>
            </div>

            <div className="z-10 flex items-center" style={{ gap: "1rem", marginTop: "2rem" }}>
              <div className="flex" style={{ marginRight: "0.25rem" }}>
                {[
                  { bg: "#0D9488", label: "A" },
                  { bg: "#0891b2", label: "B" },
                  { bg: "#596065", label: "C" },
                ].map(({ bg, label }, i) => (
                  <div
                    key={i}
                    className="rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{
                      width: "2.25rem", height: "2.25rem",
                      backgroundColor: bg,
                      border: "2px solid #f2f4f6",
                      marginLeft: i === 0 ? 0 : "-0.75rem",
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#596065" }}>
                Trusted by residents &amp; admins
              </span>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div
            className="flex flex-col justify-center overflow-y-auto"
            style={{ padding: "2.5rem 3rem", backgroundColor: "#ffffff", maxHeight: "100vh" }}
          >
            {/* Mobile wordmark */}
            <div className="mb-5 lg:hidden">
              <span className="font-black tracking-tighter" style={{ fontSize: "1.25rem", color: "#2d3338", letterSpacing: "-0.04em" }}>
                Resolv
              </span>
            </div>

            <div style={{ marginBottom: "1.75rem" }}>
              <h3
                className="font-bold tracking-tight"
                style={{ fontSize: "1.75rem", color: "#2d3338", letterSpacing: "-0.02em", marginBottom: "0.35rem" }}
              >
                Create Account
              </h3>
              <p style={{ color: "#596065", fontSize: "0.875rem" }}>
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{ color: "#0D9488", fontWeight: 600, textDecoration: "none" }}
                  onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                  onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                >
                  Sign in
                </Link>
              </p>
            </div>

            {error && (
              <div
                className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm"
                style={{ backgroundColor: "#fee2e2", color: "#752121" }}
              >
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Name row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>First Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="John"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.boxShadow = "0 0 0 2px rgba(13,148,136,0.4)"}
                    onBlur={(e) => e.target.style.boxShadow = "none"}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Last Name</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Doe"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.boxShadow = "0 0 0 2px rgba(13,148,136,0.4)"}
                    onBlur={(e) => e.target.style.boxShadow = "none"}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@company.com"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.boxShadow = "0 0 0 2px rgba(13,148,136,0.4)"}
                  onBlur={(e) => e.target.style.boxShadow = "none"}
                />
              </div>

              {/* Password */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    style={{ ...inputStyle, padding: "0 3rem 0 1.25rem" }}
                    onFocus={(e) => e.target.style.boxShadow = "0 0 0 2px rgba(13,148,136,0.4)"}
                    onBlur={(e) => e.target.style.boxShadow = "none"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#757c81", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
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
                <p style={{ fontSize: "0.7rem", color: "#596065", opacity: 0.7, marginLeft: "0.25rem" }}>
                  Must be at least 6 characters.
                </p>
              </div>


              {/* CTA */}
              <div style={{ paddingTop: "0.5rem" }}>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  style={{
                    width: "100%", height: "3rem",
                    borderRadius: "9999px",
                    background: mutation.isPending ? "#acb3b8" : "linear-gradient(135deg, #0D9488 0%, #0891b2 100%)",
                    color: "#ffffff", fontWeight: 700, fontSize: "1rem",
                    border: "none", cursor: mutation.isPending ? "not-allowed" : "pointer",
                    boxShadow: mutation.isPending ? "none" : "0 4px 24px rgba(13,148,136,0.2)",
                    transition: "all 0.3s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  }}
                  onMouseEnter={(e) => { if (!mutation.isPending) e.currentTarget.style.transform = "scale(1.01)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                  onMouseDown={(e) => { if (!mutation.isPending) e.currentTarget.style.transform = "scale(0.98)"; }}
                  onMouseUp={(e) => { if (!mutation.isPending) e.currentTarget.style.transform = "scale(1.01)"; }}
                >
                  {mutation.isPending ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Creating account…
                    </>
                  ) : "Create Account"}
                </button>
              </div>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ flexGrow: 1, height: "1px", backgroundColor: "#ebeef2" }} />
                <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#acb3b8" }}>
                  Secure &amp; private
                </span>
                <div style={{ flexGrow: 1, height: "1px", backgroundColor: "#ebeef2" }} />
              </div>
            </form>

            <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
              <p style={{ fontSize: "0.75rem", color: "#596065", lineHeight: 1.6 }}>
                By clicking "Create Account", you agree to our{" "}
                <a href="#" style={{ textDecoration: "underline", textUnderlineOffset: "2px", color: "inherit" }}>Terms of Service</a>{" "}
                and{" "}
                <a href="#" style={{ textDecoration: "underline", textUnderlineOffset: "2px", color: "inherit" }}>Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ width: "100%", borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc", position: "relative", zIndex: 10 }}>
        <div
          className="flex flex-col md:flex-row justify-between items-center"
          style={{ padding: "1rem 2rem", maxWidth: "80rem", margin: "0 auto", gap: "0.75rem" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontWeight: 700, color: "#2d3338", letterSpacing: "-0.03em", fontSize: "0.875rem" }}>Resolv</span>
            <p style={{ fontSize: "0.75rem", color: "#757c81", margin: 0 }}>© 2026 Resolv. All rights reserved.</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.5rem" }}>
            {["Privacy Policy", "Terms of Service", "Accessibility Statement", "Support"].map((link) => (
              <a
                key={link}
                href="#"
                style={{ fontSize: "0.75rem", color: "#757c81", textDecoration: "none", transition: "color 0.2s" }}
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