import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import AdminLayout from "../../components/AdminLayout";

const fetchAllComplaints = async () => {
  const { data } = await api.get("/admin/complaints");
  return data.complaints;
};

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-36">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full rounded-t-xl transition-all"
            style={{ height: `${Math.max((d.value / max) * 120, 4)}px`, backgroundColor: d.active ? "#0D9488" : "#E5E7EB" }}
          />
          <span className="text-xs font-semibold" style={{ color: d.active ? "#0D9488" : "#9CA3AF" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = 36, circ = 2 * Math.PI * r;

  // Precompute cumulative offsets purely before render
  let runningTotal = 0;
  const computedSegments = segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * circ;
    const gap = circ - dash;
    const rot = (runningTotal / total) * 360 - 90;
    runningTotal += seg.value;
    return { ...seg, dash, gap, rot };
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#F3F4F6" strokeWidth="12" />
          {computedSegments.map((seg, i) => (
            <circle key={i} cx="48" cy="48" r={r} fill="none" stroke={seg.color}
              strokeWidth="12" strokeDasharray={`${seg.dash} ${seg.gap}`} strokeLinecap="butt"
              style={{ transform: `rotate(${seg.rot}deg)`, transformOrigin: "48px 48px" }} />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black text-lg" style={{ color: "#111827", letterSpacing: "-0.03em" }}>{total}</span>
          <span className="text-xs" style={{ color: "#9CA3AF" }}>TOTAL</span>
        </div>
      </div>
      <div className="space-y-2 flex-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-xs" style={{ color: "#6B7280" }}>{seg.label}</span>
            </div>
            <span className="text-xs font-bold" style={{ color: "#374151" }}>
              {Math.round((seg.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["adminComplaints"],
    queryFn: fetchAllComplaints,
  });

  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter((c) => c.status !== "RESOLVED").length,
    resolved: complaints.filter((c) => c.status === "RESOLVED").length,
  }), [complaints]);

  const barData = useMemo(() => {
    const weeks = Array.from({ length: 6 }, (_, i) => {
      const end = new Date(); end.setDate(end.getDate() - i * 7);
      const start = new Date(end); start.setDate(start.getDate() - 7);
      const count = complaints.filter((c) => {
        const d = new Date(c.createdAt);
        return d >= start && d < end;
      }).length;
      return { label: `WK ${6 - i}`, value: count, active: i === 0 };
    }).reverse();
    return weeks;
  }, [complaints]);

  const donutSegments = useMemo(() => {
    const palette = ["#0D9488", "#374151", "#D1D5DB", "#6B7280", "#0992C2", "#F59E0B"];
    const counts = {};
    complaints.forEach((c) => {
      const cat = c.category || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value], i) => ({ label, value, color: palette[i] || "#9CA3AF" }));
  }, [complaints]);

  // Priority breakdown
  const prioritySegments = useMemo(() => {
    const palette = { high: "#EF4444", medium: "#F59E0B", low: "#10B981" };
    const counts = { high: 0, medium: 0, low: 0 };
    complaints.forEach((c) => { if (counts[c.priority] !== undefined) counts[c.priority]++; });
    return Object.entries(counts).map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value, color: palette[label] }));
  }, [complaints]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-black mb-1" style={{ color: "#111827", fontSize: "2.2rem", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
          Analytics Overview
        </h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>
          Real-time insights into resolution trends, complaint distributions, and operational performance.
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "TOTAL COMPLAINTS", value: stats.total },
          { label: "PENDING RESOLUTION", value: stats.pending },
          { label: "RESOLVED", value: stats.resolved },
        ].map((s) => (
          <div key={s.label}
            className="bg-white rounded-3xl p-5 transition-all duration-200 cursor-default"
            style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF", letterSpacing: "0.12em" }}>{s.label}</p>
            <p className="font-black" style={{ color: "#111827", fontSize: "2rem", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {isLoading ? "—" : s.value}
            </p>
            <div className="mt-3 h-1 rounded-full" style={{ backgroundColor: "#F3F4F6" }}>
              <div className="h-1 rounded-full" style={{ width: stats.total ? `${Math.round((s.value / stats.total) * 100)}%` : "0%", backgroundColor: "#0D9488" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        <div className="col-span-3 bg-white rounded-3xl p-5" style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm" style={{ color: "#111827" }}>Submissions by Week</h2>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: "#F0FDFA", color: "#0D9488" }}>Last 6 Weeks</span>
          </div>
          <BarChart data={barData} />
          <p className="text-xs mt-3" style={{ color: "#9CA3AF" }}>
            Complaint submission trend over the last 6 weeks based on real data.
          </p>
        </div>

        <div className="col-span-2 bg-white rounded-3xl p-5" style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: "#111827" }}>Complaints by Category</h2>
          {donutSegments.length > 0
            ? <DonutChart segments={donutSegments} />
            : <p className="text-sm text-center py-8" style={{ color: "#9CA3AF" }}>No data yet</p>
          }
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Status breakdown */}
        <div className="bg-white rounded-3xl p-5" style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: "#111827" }}>Status Breakdown</h2>
          {[
            { label: "Open", value: complaints.filter(c => c.status === "OPEN").length, color: "#EF4444" },
            { label: "In Progress", value: complaints.filter(c => c.status === "IN_PROGRESS").length, color: "#8B5CF6" },
            { label: "Resolved", value: complaints.filter(c => c.status === "RESOLVED").length, color: "#10B981" },
          ].map((item) => (
            <div key={item.label} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: "#374151" }}>{item.label}</span>
                <span className="text-xs font-bold" style={{ color: item.color }}>{item.value}</span>
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: "#F3F4F6" }}>
                <div className="h-2 rounded-full transition-all" style={{
                  width: stats.total ? `${Math.round((item.value / stats.total) * 100)}%` : "0%",
                  backgroundColor: item.color,
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Priority breakdown */}
        <div className="bg-white rounded-3xl p-5" style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: "#111827" }}>Priority Distribution</h2>
          {prioritySegments.length > 0
            ? <DonutChart segments={prioritySegments} />
            : <p className="text-sm text-center py-8" style={{ color: "#9CA3AF" }}>No data yet</p>
          }
        </div>
      </div>
    </AdminLayout>
  );
}
