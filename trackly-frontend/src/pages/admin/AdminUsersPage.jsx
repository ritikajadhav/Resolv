import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import AdminLayout from "../../components/AdminLayout";
import ConfirmationModal from "../../components/ConfirmationModal";
import useAuthStore from "../../store/authStore";

const fetchAllUsers = async () => {
  const { data } = await api.get("/admin/users");
  return data.users;
};

const fetchAllComplaints = async () => {
  const { data } = await api.get("/admin/complaints");
  return data.complaints;
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null); // { user, newRole }

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: fetchAllUsers,
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["adminComplaints"],
    queryFn: fetchAllComplaints,
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries(["adminUsers"]);
      setConfirmTarget(null);
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Failed to update user role");
      setConfirmTarget(null);
    },
  });

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      const matchText = [
        u.name,
        u.lastName,
        u.email,
        u.role,
        u.unit,
      ].filter(Boolean).join(" ").toLowerCase();
      return matchText.includes(q);
    });
  }, [users, searchQuery]);

  return (
    <AdminLayout
      searchTerm={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search users by name, email, or role..."
    >
      <div className="mb-6">
        <h1 className="font-black mb-1" style={{ color: "#111827", fontSize: "2.2rem", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
          Users
        </h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>All registered residents and administrators.</p>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 mb-6">
        {[
          { label: "Total Users", value: users.length, color: "#111827", bg: "#fff" },
          { label: "Admins", value: users.filter(u => u.role === "ADMIN").length, color: "#0D9488", bg: "#F0FDFA" },
          { label: "Residents", value: users.filter(u => u.role === "RESIDENT").length, color: "#374151", bg: "#F3F4F6" },
        ].map((chip) => (
          <div key={chip.label}
            className="rounded-2xl px-5 py-3 flex items-center gap-3"
            style={{ background: chip.bg, border: "1.5px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            <p className="font-black text-2xl" style={{ color: chip.color, letterSpacing: "-0.04em" }}>{chip.value}</p>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>{chip.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl overflow-hidden" style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        {searchQuery && (
          <div className="flex items-center justify-between px-6 py-2.5 bg-teal-50 border-b border-teal-100 text-xs text-teal-800 font-medium">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>
                Found <strong>{filteredUsers.length}</strong> user{filteredUsers.length === 1 ? "" : "s"} matching &ldquo;{searchQuery}&rdquo;
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-3 grid grid-cols-12 gap-4" style={{ backgroundColor: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
          {["USER", "ROLE", "COMPLAINTS", "ROLE ACTION"].map((h, i) => (
            <div key={h} className={`text-xs font-semibold uppercase tracking-widest ${i === 0 ? "col-span-5" : i === 1 ? "col-span-2" : i === 2 ? "col-span-2" : "col-span-3"}`}
              style={{ color: "#9CA3AF", letterSpacing: "0.1em" }}>
              {h}
            </div>
          ))}
        </div>

        {usersLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24" style={{ color: "#0D9488" }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {searchQuery ? `No users found matching "${searchQuery}"` : "No users found"}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-3 px-4 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#F3F4F6]">
            {filteredUsers.map((u) => {
              const count = complaints.filter((c) => c.user?.id === u.id).length;
              const initials = (u.name?.charAt(0) || u.email?.charAt(0) || "U").toUpperCase();
              const isAdmin = u.role === "ADMIN";
              const isMe = u.id === currentUser?.id || u.email === currentUser?.email;

              return (
                <div key={u.id}
                  className="px-6 py-4 grid grid-cols-12 gap-4 items-center transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFAFA")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: isAdmin ? "#0D9488" : "#374151" }}>
                      {initials}
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-sm truncate" style={{ color: "#111827" }}>
                        {u.name ? `${u.name} ${u.lastName || ""}`.trim() : u.email.split("@")[0]}
                      </p>
                      <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{u.email}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: isAdmin ? "#F0FDFA" : "#F3F4F6", color: isAdmin ? "#0D9488" : "#374151" }}>
                      {u.role}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: "#374151" }}>{count}</span>
                    <span className="text-xs" style={{ color: "#9CA3AF" }}>submitted</span>
                  </div>
                  <div className="col-span-3 flex items-center">
                    {isMe ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 italic">
                        Current Account
                      </span>
                    ) : isAdmin ? (
                      <button
                        type="button"
                        onClick={() => setConfirmTarget({ user: u, newRole: "RESIDENT" })}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer border border-gray-200"
                        title="Demote this user back to standard Resident access"
                      >
                        Demote to Resident
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmTarget({ user: u, newRole: "ADMIN" })}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 transition-colors cursor-pointer border border-teal-200"
                        title="Grant this user full Administrator permissions"
                      >
                        + Make Admin
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role Change Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!confirmTarget}
        title={
          confirmTarget?.newRole === "ADMIN"
            ? "Promote to Administrator?"
            : "Revoke Administrator Privileges?"
        }
        message={
          confirmTarget?.newRole === "ADMIN"
            ? `Are you sure you want to promote ${confirmTarget?.user?.email} to Administrator? They will be granted full access to the Admin Portal, complaint queue, and analytics.`
            : `Are you sure you want to demote ${confirmTarget?.user?.email} back to Resident? Their administrative privileges will be revoked immediately.`
        }
        confirmText={
          confirmTarget?.newRole === "ADMIN"
            ? "Yes, Make Admin"
            : "Yes, Demote"
        }
        confirmVariant={confirmTarget?.newRole === "ADMIN" ? "teal" : "danger"}
        isLoading={roleMutation.isPending}
        onConfirm={() => {
          if (confirmTarget) {
            roleMutation.mutate({
              id: confirmTarget.user.id,
              role: confirmTarget.newRole,
            });
          }
        }}
        onClose={() => {
          if (!roleMutation.isPending) setConfirmTarget(null);
        }}
      />
    </AdminLayout>
  );
}
