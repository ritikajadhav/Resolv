import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../store/authStore";
import api from "../api/axios";
import { Link } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import ComplaintModal from "../components/ComplaintModal";
import UserMenu from "../components/UserMenu";

const fetchMyComplaints = async () => {
  const { data } = await api.get("/resident/my-complaints");
  return data.complaints;
};

const statusColors = {
  OPEN: { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  IN_PROGRESS: { bg: "#DBEAFE", text: "#1E40AF", dot: "#0992C2" },
  RESOLVED: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
};


const categoryIcons = {
  OPEN: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  IN_PROGRESS: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  RESOLVED: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function ResidentDashboard() {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedComplaintId, setSelectedComplaintId] = useState(null); // ← new

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["myComplaints"],
    queryFn: fetchMyComplaints,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/resident/complaints/${id}`),
    onSuccess: () => queryClient.invalidateQueries(["myComplaints"]),
  });

  const stats = {
    total: complaints.length,
    open: complaints.filter((c) => c.status === "OPEN").length,
    inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
    resolved: complaints.filter((c) => c.status === "RESOLVED").length,
  };

  const filteredComplaints = complaints.filter((c) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Pending") return c.status === "OPEN" || c.status === "IN_PROGRESS";
    if (activeFilter === "Closed") return c.status === "RESOLVED";
    return true;
  });

  const firstName = user?.name || user?.email?.split("@")[0] || "Resident";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F6F6", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Modal: renders only when a complaint is selected ── */}
      {selectedComplaintId && (
        <ComplaintModal
          complaintId={selectedComplaintId}
          onClose={() => setSelectedComplaintId(null)}
        />
      )}

      {/* Navbar */}
      <nav className="bg-white border-b sticky top-0 z-40" style={{ borderColor: "#E8EAED" }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="font-black text-xl tracking-tight" style={{ color: "#111827", letterSpacing: "-0.04em" }}>
            Resolv
          </span>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserMenu user={user} logout={logout} accentColor="#374151" />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#6B7280", letterSpacing: "0.15em" }}>
              RESIDENT PORTAL
            </p>
            <h1 className="font-bold mb-2" style={{ color: "#111827", fontSize: "2.5rem", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Hello, {firstName.charAt(0).toUpperCase() + firstName.slice(1)}.
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>Your residency overview is up to date.</p>
          </div>
          <Link to="/submit">
            <button
              className="flex items-center gap-2 px-5 py-3 text-white font-semibold rounded-full text-sm transition-all"
              style={{ backgroundColor: "#0D9488", boxShadow: "0 4px 14px rgba(13,148,136,0.3)" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#0b7a70"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#0D9488"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New Complaint
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "OPEN CASES", value: stats.open, icon: categoryIcons.OPEN, iconColor: "#EF4444", iconBg: "#FEF2F2" },
                { label: "IN PROGRESS", value: stats.inProgress, icon: categoryIcons.IN_PROGRESS, iconColor: "#6B7280", iconBg: "#F3F4F6" },
                { label: "RESOLVED", value: stats.resolved, icon: categoryIcons.RESOLVED, iconColor: "#0D9488", iconBg: "#F0FDFA" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-3xl p-5 transition-all duration-200 cursor-default"
                  style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: stat.iconBg, color: stat.iconColor }}>
                    {stat.icon}
                  </div>
                  <p className="text-3xl font-black mb-1" style={{ color: "#111827", letterSpacing: "-0.03em" }}>
                    {String(stat.value).padStart(2, "0")}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9CA3AF", letterSpacing: "0.1em" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-3xl overflow-hidden" style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
              <div className="px-6 pt-5 pb-4 flex items-center justify-between">
                <h2 className="font-bold text-base" style={{ color: "#111827" }}>Recent Activity</h2>
                <div className="flex gap-1 p-1 rounded-full" style={{ backgroundColor: "#F3F4F6" }}>
                  {["All", "Pending", "Closed"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: activeFilter === f ? "#0D9488" : "transparent",
                        color: activeFilter === f ? "white" : "#6B7280",
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24" style={{ color: "#0D9488" }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="px-6 pb-8 pt-4 text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#F3F4F6" }}>
                    <svg className="w-6 h-6" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="font-semibold text-sm mb-1" style={{ color: "#374151" }}>No complaints yet</p>
                  <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Submit your first complaint to get started</p>
                  <Link to="/submit">
                    <button
                      className="px-5 py-2 text-white font-semibold rounded-full text-xs"
                      style={{ backgroundColor: "#0D9488" }}
                    >
                      Submit a complaint
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E7EB]">
                  {filteredComplaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="px-6 py-4 flex items-center gap-4 transition-colors cursor-pointer"
                      onClick={() => setSelectedComplaintId(complaint.id)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#FAFAFA"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      {/* Icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: complaint.status === "OPEN" ? "#FEF2F2" : complaint.status === "IN_PROGRESS" ? "#F3F4F6" : "#F0FDFA",
                          color: complaint.status === "OPEN" ? "#EF4444" : complaint.status === "IN_PROGRESS" ? "#6B7280" : "#0D9488",
                        }}
                      >
                        {categoryIcons[complaint.status] || categoryIcons.OPEN}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: "#111827" }}>
                          {complaint.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                          Ref: #{complaint.id?.toString().slice(0, 8).toUpperCase() || "N/A"} · {new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>

                      {/* Status badge + delete — stopPropagation so clicks here don't open the modal */}
                      <div
                        className="flex items-center gap-2 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide"
                          style={{
                            backgroundColor: statusColors[complaint.status]?.bg,
                            color: statusColors[complaint.status]?.text,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors[complaint.status]?.dot }} />
                          {complaint.status.replace("_", " ")}
                        </span>

                        {complaint.status === "OPEN" && (
                          <button
                            onClick={() => deleteMutation.mutate(complaint.id)}
                            className="p-1.5 rounded-lg transition"
                            style={{ color: "#D1D5DB" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.backgroundColor = "#FEF2F2"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "#D1D5DB"; e.currentTarget.style.backgroundColor = "transparent"; }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}

                        <svg className="w-4 h-4" fill="none" stroke="#D1D5DB" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Need Immediate Help */}
            <div className="rounded-3xl p-5 text-white relative overflow-hidden" style={{ backgroundColor: "#1F2937", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
              <div className="absolute right-0 bottom-0 opacity-10">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="white">
                  <circle cx="90" cy="90" r="60" />
                  <circle cx="90" cy="90" r="40" fill="none" stroke="white" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="font-bold text-base mb-1 relative z-10">Need Immediate Help?</h3>
              <p className="text-xs leading-relaxed mb-4 relative z-10" style={{ color: "#9CA3AF" }}>
                For urgent maintenance emergencies like gas leaks or major flooding, please call our 24/7 hotline.
              </p>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all relative z-10"
                style={{ backgroundColor: "#374151", color: "white" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#4B5563"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#374151"}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +1 (800) RESOLV-NOW
              </button>
            </div>

            {/* Community Guidelines */}
            <div className="bg-white rounded-3xl p-5" style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
              <h3 className="font-bold text-sm mb-4" style={{ color: "#111827" }}>Community Guidelines</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "#EFF6FF" }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="#3B82F6" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                    Be descriptive in your reports to help us resolve issues faster.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "#F0FDFA" }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="#0D9488" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                    Attach photos whenever possible for structural concerns.
                  </p>
                </div>
              </div>
            </div>

            {/* Promo card */}
            <div className="rounded-4xl overflow-hidden relative aspect-square">
              <img
                alt="Building amenities"
                className="w-full h-full object-cover"
                data-alt="ultra-modern minimalist apartment building lobby with high ceilings, sleek furniture, and soft warm interior lighting"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYqtTM0nArHV11oMnDvnz72TtMB0kUtQeiQpq4Lh7PmgiHwPgYxOPtD8u4Q59eb1NImdesB-8H-vnYayx0MP7MSsfi5683f_zDOgK7jCfHHM4Ri-fWQJhH_pqMu5vo2RNkg4CNkxSYyMBaa3n9SfoTyqyu2qWa5naNKICQbZYJ0_N1UrX1jApsXimridms9KttbEXUVmb1HaFWSr4XNUqsjTC4tQMUxnaa0PTzZb-4iSojh-a_CeBcJ6d7OeiqKNPcU3rU20X4n8k"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                <p className="text-white font-medium text-lg leading-tight">Improving our community <br />one request at a time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-12" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-black text-sm tracking-tight" style={{ color: "#111827", letterSpacing: "-0.03em" }}>Resolv</span>
            <span className="text-xs" style={{ color: "#9CA3AF" }}>© 2026 RESOLV SYSTEMS. HIGH-END EDITORIAL INTERFACE.</span>
          </div>
          <div className="flex gap-5">
            {["Privacy Policy", "Terms of Service", "Accessibility Support", "Contact Admin"].map((l) => (
              <a key={l} href="#" className="text-xs transition-colors" style={{ color: "#9CA3AF" }}
                onMouseEnter={(e) => e.target.style.color = "#374151"}
                onMouseLeave={(e) => e.target.style.color = "#9CA3AF"}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}