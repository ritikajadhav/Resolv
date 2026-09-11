
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { getImageUrl } from "../api/axios";
 
const fetchComplaint = async (id) => {
  const { data } = await api.get(`/resident/complaints/${id}`);
  return data.complaint;
};
 
const statusColors = {
  OPEN: { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  IN_PROGRESS: { bg: "#DBEAFE", text: "#1E40AF", dot: "#0992C2" },
  RESOLVED: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
};
 
const priorityColors = {
  high: { bg: "#FEE2E2", text: "#991B1B" },
  medium: { bg: "#FEF3C7", text: "#92400E" },
  low: { bg: "#D1FAE5", text: "#065F46" },
};
 
export default function ComplaintModal({ complaintId, onClose }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", location: "" });
  const [formError, setFormError] = useState("");
 
  const { data: complaint, isLoading } = useQuery({
    queryKey: ["complaint", complaintId],
    queryFn: () => fetchComplaint(complaintId),
    enabled: !!complaintId,
  });
 
  // Pre-fill form whenever complaint data arrives
  useEffect(() => {
    if (complaint) {
      setForm({
        title: complaint.title || "",
        description: complaint.description || "",
        location: complaint.location || "",
        image: complaint.image || ""
      });
    }
  }, [complaint]);
 
  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/resident/complaints/${complaintId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["myComplaints"]);
      queryClient.invalidateQueries(["complaint", complaintId]);
      setIsEditing(false);
      setFormError("");
    },
    onError: (err) => {
      setFormError(err?.response?.data?.message || "Failed to update. Please try again.");
    },
  });
 
  const handleSave = () => {
    if (!form.title.trim()) return setFormError("Title is required.");
    if (!form.description.trim()) return setFormError("Description is required.");
    setFormError("");
    updateMutation.mutate(form);
  };
 
  const handleCancelEdit = () => {
    // Reset form back to saved values
    if (complaint) {
      setForm({
        title: complaint.title || "",
        description: complaint.description || "",
        location: complaint.location || "",
        image: complaint.image || ""
      });
    }
    setFormError("");
    setIsEditing(false);
  };
 
  const canEdit = complaint?.status === "OPEN";
 
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
 
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full bg-white rounded-3xl overflow-hidden flex flex-col"
        style={{
          maxWidth: "560px",
          maxHeight: "90vh",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid #F3F4F6" }}
        >
          <div className="flex items-center gap-3">
            <span className="font-bold text-base" style={{ color: "#111827" }}>
              {isEditing ? "Edit Complaint" : "Complaint Details"}
            </span>
            {complaint && (
              <span
                className="text-xs font-mono px-2 py-1 rounded-lg"
                style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
              >
                #{complaint.id?.toString().slice(0, 8).toUpperCase()}
              </span>
            )}
          </div>
 
          <div className="flex items-center gap-2">
            {/* Edit / Cancel toggle — only for OPEN complaints */}
            {canEdit && !isLoading && (
              <button
                onClick={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: isEditing ? "#F3F4F6" : "#F0FDFA",
                  color: isEditing ? "#6B7280" : "#0D9488",
                  border: isEditing ? "1px solid #E5E7EB" : "1px solid #99F6E4",
                }}
              >
                {isEditing ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </>
                )}
              </button>
            )}
 
            {/* Close */}
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
        </div>
 
        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24" style={{ color: "#0D9488" }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : complaint ? (
            <>
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide"
                  style={{
                    backgroundColor: statusColors[complaint.status]?.bg,
                    color: statusColors[complaint.status]?.text,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: statusColors[complaint.status]?.dot }}
                  />
                  {complaint.status.replace("_", " ")}
                </span>
 
                {complaint.priority && (
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full capitalize"
                    style={{
                      backgroundColor: priorityColors[complaint.priority]?.bg,
                      color: priorityColors[complaint.priority]?.text,
                    }}
                  >
                    {complaint.priority} priority
                  </span>
                )}
 
                {complaint.category && (
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}
                  >
                    {complaint.category}
                  </span>
                )}
              </div>
 
              {/* Image */}
              {complaint.image && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: "1px solid #E5E7EB" }}
                >
                  <img
                    src={getImageUrl(complaint.image)}
                    alt="Complaint attachment"
                    className="w-full object-cover"
                    style={{ maxHeight: "220px" }}
                  />
                </div>
              )}
 
              {/* Fields */}
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                      style={{ color: "#6B7280" }}
                    >
                      Title
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full px-4 py-2.5 text-sm rounded-xl outline-none transition"
                      style={{ border: "1.5px solid #E5E7EB", color: "#111827", backgroundColor: "#FAFAFA" }}
                      onFocus={(e) => (e.target.style.borderColor = "#0D9488")}
                      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                    />
                  </div>
 
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                      style={{ color: "#6B7280" }}
                    >
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-2.5 text-sm rounded-xl outline-none resize-none transition"
                      style={{ border: "1.5px solid #E5E7EB", color: "#111827", backgroundColor: "#FAFAFA" }}
                      onFocus={(e) => (e.target.style.borderColor = "#0D9488")}
                      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                    />
                  </div>
 
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                      style={{ color: "#6B7280" }}
                    >
                      Location
                    </label>
                    <input
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="e.g. Block C, Floor 3"
                      className="w-full px-4 py-2.5 text-sm rounded-xl outline-none transition"
                      style={{ border: "1.5px solid #E5E7EB", color: "#111827", backgroundColor: "#FAFAFA" }}
                      onFocus={(e) => (e.target.style.borderColor = "#0D9488")}
                      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                    />
                  </div>
 
                  {formError && (
                    <p className="text-xs font-medium" style={{ color: "#EF4444" }}>
                      {formError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wide mb-1"
                      style={{ color: "#9CA3AF" }}
                    >
                      Title
                    </p>
                    <p className="text-sm font-semibold" style={{ color: "#111827" }}>
                      {complaint.title}
                    </p>
                  </div>
 
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wide mb-1"
                      style={{ color: "#9CA3AF" }}
                    >
                      Description
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
                      {complaint.description}
                    </p>
                  </div>
 
                  {complaint.location && (
                    <div>
                      <p
                        className="text-xs font-semibold uppercase tracking-wide mb-1"
                        style={{ color: "#9CA3AF" }}
                      >
                        Location
                      </p>
                      <p
                        className="text-sm flex items-center gap-1.5"
                        style={{ color: "#374151" }}
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {complaint.location}
                      </p>
                    </div>
                  )}
 
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wide mb-1"
                      style={{ color: "#9CA3AF" }}
                    >
                      Submitted
                    </p>
                    <p className="text-sm" style={{ color: "#374151" }}>
                      {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
 
                  {!canEdit && (
                    <div
                      className="flex items-center gap-2 px-4 py-3 rounded-xl"
                      style={{ backgroundColor: "#F3F4F6" }}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <p className="text-xs" style={{ color: "#6B7280" }}>
                        Only <strong>OPEN</strong> complaints can be edited.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-center py-16" style={{ color: "#9CA3AF" }}>
              Complaint not found.
            </p>
          )}
        </div>
 
        {/* Footer — Save button only shown when editing */}
        {isEditing && (
          <div
            className="px-6 py-4 shrink-0"
            style={{ borderTop: "1px solid #F3F4F6" }}
          >
            <button
              onClick={handleSave}
              disabled={updateMutation.isLoading}
              className="w-full py-3 rounded-full text-sm font-semibold text-white transition"
              style={{
                backgroundColor: updateMutation.isLoading ? "#5EEAD4" : "#0D9488",
                cursor: updateMutation.isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(13,148,136,0.3)",
              }}
            >
              {updateMutation.isLoading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}