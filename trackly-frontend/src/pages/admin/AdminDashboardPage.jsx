import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import AdminLayout from "../../components/AdminLayout";
import AdminComplaintModal from "../../components/AdminComplaintModal";
import ConfirmationModal from "../../components/ConfirmationModal";
const fetchAllComplaints = async () => {
  const { data } = await api.get("/admin/complaints");
  return data.complaints;
};

const statusColors = {
  OPEN:        { bg: "#FEE2E2", text: "#991B1B", label: "● Open" },
  IN_PROGRESS: { bg: "#EDE9FE", text: "#5B21B6", label: "● In Progress" },
  RESOLVED:    { bg: "#D1FAE5", text: "#065F46", label: "● Resolved" },
};

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  const d = new Date(dateStr);
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
};

const ITEMS_PER_PAGE = 6;

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const urlQuery = searchParams.get("search");
    if (urlQuery !== null && urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
  }, [searchParams]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
    if (val.trim()) {
      setSearchParams({ search: val });
    } else {
      setSearchParams({});
    }
  };

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["adminComplaints"],
    queryFn: fetchAllComplaints,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/complaints/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(["adminComplaints"]);
      setConfirmAction(null);
    },
    onError: () => {
      setConfirmAction(null);
    },
  });

  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter((c) => c.status !== "RESOLVED").length,
    resolved: complaints.filter((c) => c.status === "RESOLVED").length,
  }), [complaints]);

  const displayedComplaints = useMemo(() => {
    if (!searchQuery.trim()) {
      return complaints.filter((c) => c.status !== "RESOLVED");
    }
    const q = searchQuery.toLowerCase().trim();
    return complaints.filter((c) => {
      const matchText = [
        c.title,
        c.description,
        c.category,
        c.priority,
        c.status,
        c.user?.name,
        c.user?.lastName,
        c.user?.email,
        c.user?.unit,
        String(c.id),
        `INV-${String(c.id).padStart(4, "0")}`,
        `USR-${String(c.id).padStart(4, "0")}`,
        `LOG-${String(c.id).padStart(4, "0")}`,
      ].filter(Boolean).join(" ").toLowerCase();
      return matchText.includes(q);
    });
  }, [complaints, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(displayedComplaints.length / ITEMS_PER_PAGE));
  const paginatedComplaints = displayedComplaints.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <AdminLayout
      searchTerm={searchQuery}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search complaints by title, resident, category..."
    >
      
      {/* Hero Header */}
      <div className="mb-6">
        {/* AI Assistant Banner */}
<div
  className="relative overflow-hidden rounded-3xl mb-8 flex flex-col lg:flex-row items-stretch"
  style={{ backgroundColor: "#111827", minHeight: "160px" }}
>
  {/* Gradient overlay */}
  <div
    className="absolute inset-0 pointer-events-none"
    style={{ background: "linear-gradient(to right, rgba(13,148,136,0.15), transparent)" }}
  />

  {/* Accent blur */}
  <div
    className="absolute -right-20 -top-20 pointer-events-none rounded-full"
    style={{ width: "256px", height: "256px", backgroundColor: "rgba(13,148,136,0.2)", filter: "blur(100px)" }}
  />

  {/* Left image panel */}
  <div
    className="hidden lg:block w-1/4 relative overflow-hidden"
    style={{ borderRadius: "20px 0 0 20px" }}
  >
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuB4QxQ5BHxVdVT3LiJhVr3t19yK_xlHsVCyjRqfDqY6m-7YG1LIvR0Syt1KiZU4h-3hnQndVPFTnTFThI0VRkn67ZEZdgbzRao5A5rYpVkEOV8Kewuf5WLbDMAHi90gsCmAyXaNT9sAhBE7MQaTjy-e4g_XsOM6WAqTZirsvnY1k7jZQWlTyD86o2k1qWsb7dz2Kc9YROGMeZYmJt5wbAKT9fQRlGFOIb_OZgzUZCiQvRm_4P2BEYqK08tiSoCYjP9SsF07jEFtAco")` }}
    />
    <div className="absolute inset-0" style={{ backgroundColor: "rgba(17,24,39,0.2)" }} />
  </div>

  {/* Content */}
  <div className="flex-1 flex flex-col lg:flex-row items-center justify-between gap-6 px-8 py-6 relative z-0">
    <div className="flex flex-col gap-1.5 text-center lg:text-left">
      <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: "#5eead4" }}>
          <path d="M12 2L9.09 8.26L2 9.27L7 14.14L5.82 21.02L12 17.77L18.18 21.02L17 14.14L22 9.27L14.91 8.26L12 2Z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#5eead4", letterSpacing: "0.2em" }}>
          Intelligence Suite
        </span>
      </div>
      <h2 className="font-black tracking-tight leading-tight" style={{ color: "#ffffff", fontSize: "1.6rem" }}>
        How many plumbing complaints are open?{" "}
        <span style={{ color: "#5eead4" }}>Ask AI now!</span>
      </h2>
      <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
        Navigate operational data with natural language insights.
      </p>
    </div>

    <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
      <button
        onClick={() => navigate("/admin/query")}
        className="flex items-center gap-3 px-8 font-bold text-sm text-white transition-transform hover:scale-[1.02]"
        style={{
          height: "48px",
          borderRadius: "9999px",
          background: "linear-gradient(135deg, #0D9488, #0891b2)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}
      >
        <span>Try AI Assistant</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
      
    </div>
  </div>
</div>
        <h1 className="font-black mb-1" style={{ color: "#111827", fontSize: "2.2rem", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
          Administrative Core
        </h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>
          Management portal for system oversight and resolution orchestration.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Card 1 — Total */}
        <div
          className="bg-white rounded-3xl p-5 relative overflow-hidden transition-all duration-200 cursor-default"
          style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.12)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#9CA3AF", letterSpacing: "0.12em" }}>SYSTEM VELOCITY</p>
          <p className="font-semibold text-sm mb-2" style={{ color: "#374151" }}>Operational Summary</p>
          <p className="font-black" style={{ color: "#111827", fontSize: "2rem", letterSpacing: "-0.04em", lineHeight: 1 }}>
            {isLoading ? "—" : stats.total.toLocaleString()}
          </p>
          <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "#9CA3AF", letterSpacing: "0.1em" }}>TOTAL LIFECYCLE ENTRIES</p>
          <div className="absolute bottom-4 right-4 opacity-10">
            <svg className="w-10 h-10" fill="#374151" viewBox="0 0 24 24">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>

        {/* Card 2 — Pending */}
        <div
          className="rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 cursor-default"
          style={{ backgroundColor: "#0D9488", boxShadow: "0 4px 20px rgba(13,148,136,0.35)" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(13,148,136,0.45)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(13,148,136,0.35)"; }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            <svg className="w-4 h-4" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="font-black text-white" style={{ fontSize: "2rem", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {isLoading ? "—" : stats.pending.toLocaleString()}
            </p>
            <p className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em" }}>PENDING RESOLUTION</p>
          </div>
        </div>

        {/* Card 3 — Resolved */}
        <div
          className="rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 cursor-default"
          style={{ backgroundColor: "#F3F4F6", border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.05)"; }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#E5E7EB" }}>
            <svg className="w-4 h-4" fill="none" stroke="#374151" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-black" style={{ color: "#111827", fontSize: "2rem", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {isLoading ? "—" : stats.resolved.toLocaleString()}
            </p>
            <p className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: "#9CA3AF", letterSpacing: "0.1em" }}>RESOLVED TICKETS</p>
          </div>
        </div>
      </div>

      {/* Management Queue */}
      <div className="bg-white rounded-3xl overflow-hidden" style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <div className="px-6 py-5 flex items-start justify-between" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: "#111827" }}>Management Queue</h2>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Active requests requiring administrative intervention.</p>
          </div>
        </div>

        {searchQuery && (
          <div className="flex items-center justify-between px-6 py-2.5 bg-teal-50 border-b border-teal-100 text-xs text-teal-800 font-medium">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>
                Found <strong>{displayedComplaints.length}</strong> complaint{displayedComplaints.length === 1 ? "" : "s"} matching &ldquo;{searchQuery}&rdquo;
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Table header */}
        <div className="px-6 py-3 grid grid-cols-12 gap-4" style={{ backgroundColor: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
          {["ENTITY REFERENCE", "CATEGORY", "ORIGIN", "STATE", "INTERVENTION"].map((h, i) => (
            <div key={h} className={`text-xs font-semibold uppercase tracking-widest ${i === 0 ? "col-span-4" : i === 1 ? "col-span-2" : i === 2 ? "col-span-2" : i === 3 ? "col-span-2" : "col-span-2"}`}
              style={{ color: "#9CA3AF", letterSpacing: "0.1em" }}>
              {h}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24" style={{ color: "#0D9488" }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : paginatedComplaints.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {searchQuery ? `No complaints found matching "${searchQuery}"` : "No active complaints in queue"}
            </p>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="mt-3 px-4 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer transition-colors"
              >
                Clear search
              </button>
            ) : null}
          </div>
        ) : (
          <div className="divide-y divide-[#F3F4F6]">
            {paginatedComplaints.map((complaint) => {
              const sc = statusColors[complaint.status] || statusColors.OPEN;
              const prefixes = { OPEN: "INV", IN_PROGRESS: "USR", RESOLVED: "LOG" };
              const prefix = prefixes[complaint.status] || "REF";
              const refId = `${prefix}-${String(complaint.id).padStart(4, "0")}`;
              const iconBg = { OPEN: "#ffffffff", IN_PROGRESS: "#ffffffff", RESOLVED: "#ffffffff" };
              const iconStroke = { OPEN: "#6B7280", IN_PROGRESS: "#6B7280", RESOLVED: "#6B7280" };
              return (
                <div
                  key={complaint.id}
                  className="px-6 py-4 grid grid-cols-12 gap-4 items-center transition-colors cursor-pointer"
                  onClick={() => setSelectedComplaintId(complaint.id)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFAFA")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: iconBg[complaint.status] || "#F3F4F6" }}>
                      <svg className="w-4 h-4" fill="none" stroke={iconStroke[complaint.status] || "#374151"} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm" style={{ color: "#111827" }}>{refId}</p>
                      <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{complaint.title}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs font-medium" style={{ color: "#374151" }}>{complaint.category || "General"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs" style={{ color: "#6B7280" }}>{timeAgo(complaint.createdAt)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text }}>
                      {sc.label}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      style={{ border: "1px solid #E5E7EB", color: "#374151" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmAction({
                          complaintId: complaint.id,
                          status: "IN_PROGRESS",
                          refId,
                          title: complaint.title,
                        });
                      }}
                    >
                      Assign
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer"
                      style={{ backgroundColor: "#0D9488" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0b7a70")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0D9488")}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmAction({
                          complaintId: complaint.id,
                          status: "RESOLVED",
                          refId,
                          title: complaint.title,
                        });
                      }}
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: "1px solid #F3F4F6" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9CA3AF", letterSpacing: "0.1em" }}>
            SHOWING {Math.min(paginatedComplaints.length, ITEMS_PER_PAGE)} OF {displayedComplaints.length} {searchQuery ? "MATCHING" : "ACTIVE"} CASES
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ border: "1px solid #E5E7EB", color: currentPage === 1 ? "#D1D5DB" : "#374151" }}
              onMouseEnter={(e) => { if (currentPage > 1) e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>{currentPage} / {totalPages || 1}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ border: "1px solid #E5E7EB", color: currentPage >= totalPages ? "#D1D5DB" : "#374151" }}
              onMouseEnter={(e) => { if (currentPage < totalPages) e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Complaint Detail Modal */}
      {selectedComplaintId && (
        <AdminComplaintModal
          complaintId={selectedComplaintId}
          onClose={() => setSelectedComplaintId(null)}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!confirmAction}
        title={
          confirmAction?.status === "RESOLVED"
            ? "Resolve Complaint?"
            : "Assign Complaint?"
        }
        message={
          confirmAction?.status === "RESOLVED"
            ? `Are you sure you want to mark ticket ${confirmAction?.refId} ("${confirmAction?.title}") as Resolved? The resident will receive a status resolution email.`
            : `Are you sure you want to move ticket ${confirmAction?.refId} ("${confirmAction?.title}") to In Progress and assign it for maintenance?`
        }
        confirmText={
          confirmAction?.status === "RESOLVED"
            ? "Yes, Resolve"
            : "Yes, Assign"
        }
        confirmVariant={confirmAction?.status === "RESOLVED" ? "green" : "teal"}
        isLoading={updateMutation.isPending}
        onConfirm={() => {
          if (confirmAction) {
            updateMutation.mutate({
              id: confirmAction.complaintId,
              status: confirmAction.status,
            });
          }
        }}
        onClose={() => {
          if (!updateMutation.isPending) setConfirmAction(null);
        }}
      />
    </AdminLayout>
  );
}