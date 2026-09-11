import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { getImageUrl } from "../api/axios";
import ConfirmationModal from "./ConfirmationModal";

const fetchComplaint = async (id) => {
  const { data } = await api.get(`/admin/complaints/${id}`);
  return data.complaint;
};

const statusConfig = {
  OPEN:        { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444",  label: "Open" },
  IN_PROGRESS: { bg: "#EDE9FE", text: "#5B21B6", dot: "#8B5CF6",  label: "In Progress" },
  RESOLVED:    { bg: "#D1FAE5", text: "#065F46", dot: "#10B981",  label: "Resolved" },
};

const priorityConfig = {
  high:   { bg: "#FEE2E2", text: "#991B1B" },
  medium: { bg: "#FEF3C7", text: "#92400E" },
  low:    { bg: "#D1FAE5", text: "#065F46" },
};

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED"];

export default function AdminComplaintModal({ complaintId, onClose }) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [pendingStatusConfirm, setPendingStatusConfirm] = useState(null);

  const { data: complaint, isLoading } = useQuery({
    queryKey: ["adminComplaint", complaintId],
    queryFn: () => fetchComplaint(complaintId),
    enabled: !!complaintId,
  });

  useEffect(() => {
    if (complaint) {
      setSelectedStatus(complaint.status);
      setComment(complaint.notes || "");
    }
  }, [complaint]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const statusMutation = useMutation({
    mutationFn: (status) => api.patch(`/admin/complaints/${complaintId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(["adminComplaints"]);
      queryClient.invalidateQueries(["adminComplaint", complaintId]);
      setPendingStatusConfirm(null);
    },
    onError: () => {
      setPendingStatusConfirm(null);
    },
  });

  const noteMutation = useMutation({
    mutationFn: () =>
      api.post("/admin/notes", { complaintId, content: comment.trim() }),
    onSuccess: () => {
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 3000);
      queryClient.invalidateQueries(["adminComplaint", complaintId]);
    },
  });

  const handleStatusChange = (status) => {
    if (status === complaint?.status) return;
    if (status === "IN_PROGRESS" || status === "RESOLVED") {
      setPendingStatusConfirm(status);
    } else {
      setSelectedStatus(status);
      statusMutation.mutate(status);
    }
  };

  const handleConfirmStatus = () => {
    if (pendingStatusConfirm) {
      setSelectedStatus(pendingStatusConfirm);
      statusMutation.mutate(pendingStatusConfirm);
    }
  };

  const handleNote = () => {
    if (!comment.trim()) return;
    noteMutation.mutate();
  };

  const sc = statusConfig[complaint?.status] || statusConfig.OPEN;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full bg-white flex flex-col overflow-hidden"
        style={{
          maxWidth: "860px",
          maxHeight: "92vh",
          borderRadius: "28px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-7 py-5 shrink-0"
          style={{ borderBottom: "1px solid #F3F4F6" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F0FDFA" }}>
              <svg className="w-4 h-4" fill="none" stroke="#0D9488" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-black text-sm" style={{ color: "#111827", letterSpacing: "-0.02em" }}>Complaint Detail</p>
              {complaint && (
                <p className="text-xs font-mono" style={{ color: "#9CA3AF" }}>
                  #{String(complaint.id).padStart(6, "0")}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition"
            style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E5E7EB")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24" style={{ color: "#0D9488" }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : complaint ? (
            <div className="flex" style={{ minHeight: 0 }}>

              {/* ── LEFT COLUMN ── */}
              <div className="flex-1 px-7 py-6 space-y-6" style={{ borderRight: complaint.image ? "1px solid #F3F4F6" : "none" }}>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide"
                    style={{ backgroundColor: sc.bg, color: sc.text }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.dot }} />
                    {sc.label}
                  </span>
                  {complaint.priority && (
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full capitalize"
                      style={{ backgroundColor: priorityConfig[complaint.priority]?.bg, color: priorityConfig[complaint.priority]?.text }}
                    >
                      {complaint.priority} priority
                    </span>
                  )}
                  {complaint.category && (
                    <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}>
                      {complaint.category}
                    </span>
                  )}
                  <span className="text-xs font-medium px-3 py-1 rounded-full ml-auto" style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>
                    {new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>

                {/* Title + Description */}
                <div>
                  <h2 className="font-black mb-2" style={{ color: "#111827", fontSize: "1.25rem", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                    {complaint.title}
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
                    {complaint.description}
                  </p>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-4 rounded-2xl p-4" style={{ backgroundColor: "#FAFAFA", border: "1px solid #F3F4F6" }}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#9CA3AF" }}>Submitted By</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#374151" }}>
                        {complaint.user?.email?.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-medium truncate" style={{ color: "#111827" }}>{complaint.user?.email}</p>
                    </div>
                  </div>
                  {complaint.location && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#9CA3AF" }}>Location</p>
                      <p className="text-sm flex items-center gap-1.5" style={{ color: "#374151" }}>
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {complaint.location}
                      </p>
                    </div>
                  )}
                </div>

                {/* Status control */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#9CA3AF" }}>Update Status</p>
                  <div className="flex gap-2">
                    {STATUS_OPTIONS.map((s) => {
                      const cfg = statusConfig[s];
                      const isActive = selectedStatus === s;
                      const isUpdating = statusMutation.isPending && selectedStatus === s;
                      return (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          disabled={statusMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all"
                          style={{
                            backgroundColor: isActive ? cfg.bg : "#F9FAFB",
                            color: isActive ? cfg.text : "#9CA3AF",
                            border: isActive ? `1.5px solid ${cfg.dot}` : "1.5px solid #E5E7EB",
                            cursor: statusMutation.isPending ? "not-allowed" : "pointer",
                            opacity: statusMutation.isPending && !isActive ? 0.5 : 1,
                          }}
                        >
                          {isUpdating ? (
                            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isActive ? cfg.dot : "#D1D5DB" }} />
                          )}
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                  {statusMutation.isSuccess && (
                    <p className="text-xs mt-2 font-medium" style={{ color: "#0D9488" }}>✓ Status updated successfully</p>
                  )}
                </div>

                <div style={{ height: "1px", backgroundColor: "#F3F4F6" }} />

                {/* Admin Note */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#9CA3AF" }}>Admin Note</p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Add an internal note for this complaint..."
                    className="w-full px-4 py-3 text-sm rounded-xl outline-none resize-none transition"
                    style={{ border: "1.5px solid #E5E7EB", color: "#111827", backgroundColor: "#FAFAFA", lineHeight: 1.6 }}
                    onFocus={(e) => (e.target.style.borderColor = "#0D9488")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                  />
                  <div className="flex items-center justify-between mt-2">
                    {commentSuccess ? (
                      <p className="text-xs font-medium" style={{ color: "#0D9488" }}>✓ Note saved successfully</p>
                    ) : (
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>Internal note — not visible to residents.</p>
                    )}
                    <button
                      onClick={handleNote}
                      disabled={!comment.trim() || noteMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition"
                      style={{
                        backgroundColor: !comment.trim() || noteMutation.isPending ? "#D1D5DB" : "#111827",
                        cursor: !comment.trim() || noteMutation.isPending ? "not-allowed" : "pointer",
                      }}
                      onMouseEnter={(e) => { if (comment.trim() && !noteMutation.isPending) e.currentTarget.style.backgroundColor = "#0D9488"; }}
                      onMouseLeave={(e) => { if (comment.trim() && !noteMutation.isPending) e.currentTarget.style.backgroundColor = "#111827"; }}
                    >
                      {noteMutation.isPending ? (
                        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                      {noteMutation.isPending ? "Saving…" : "Save Note"}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── RIGHT COLUMN — Image ── */}
              {complaint.image && (
                <div className="shrink-0 px-6 py-6 flex flex-col gap-3" style={{ width: "full" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Attached Photo</p>
                  <div className="rounded-2xl overflow-hidden flex-1" style={{ border: "1px solid #E5E7EB" }}>
                    <img
                      src={getImageUrl(complaint.image)}
                      alt="Complaint attachment"
                      className="w-full h-full object-cover"
                      style={{ minHeight: "200px", maxHeight: "100%" }}
                    />
                  </div>
                </div>
              )}

            </div>
          ) : (
            <p className="text-sm text-center py-16" style={{ color: "#9CA3AF" }}>Complaint not found.</p>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!pendingStatusConfirm}
        title={
          pendingStatusConfirm === "RESOLVED"
            ? "Resolve Complaint?"
            : "Assign Complaint?"
        }
        message={
          pendingStatusConfirm === "RESOLVED"
            ? `Are you sure you want to mark this complaint as Resolved? A resolution notification will be sent to the resident.`
            : `Are you sure you want to update this complaint to In Progress and assign it for maintenance?`
        }
        confirmText={
          pendingStatusConfirm === "RESOLVED"
            ? "Yes, Resolve"
            : "Yes, Assign"
        }
        confirmVariant={pendingStatusConfirm === "RESOLVED" ? "green" : "teal"}
        isLoading={statusMutation.isPending}
        onConfirm={handleConfirmStatus}
        onClose={() => {
          if (!statusMutation.isPending) setPendingStatusConfirm(null);
        }}
      />
    </div>
  );
}