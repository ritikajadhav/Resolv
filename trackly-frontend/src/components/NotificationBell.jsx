import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/axios";

const POLL_INTERVAL = 30_000; // 30 seconds

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently fail polling
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {/* ignore */}
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {/* ignore */}
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full transition-colors"
        style={{
          backgroundColor: open ? "#E5E7EB" : "#F3F4F6",
        }}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="#374151" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center text-white font-bold rounded-full"
            style={{
              backgroundColor: "#EF4444",
              fontSize: "9px",
              minWidth: "16px",
              height: "16px",
              padding: "0 3px",
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 bg-white rounded-2xl overflow-hidden z-50"
          style={{
            width: "340px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
            top: "calc(100% + 8px)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid #F3F4F6" }}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color: "#111827" }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold transition-colors"
                style={{ color: "#0D9488" }}
                onMouseEnter={(e) => (e.target.style.color = "#0b7a70")}
                onMouseLeave={(e) => (e.target.style.color = "#0D9488")}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: "#F3F4F6" }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: "#374151" }}>
                  All caught up
                </p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#F9FAFB" }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && handleMarkRead(n.id)}
                    className="flex items-start gap-3 px-5 py-4 transition-colors cursor-pointer"
                    style={{
                      backgroundColor: n.isRead ? "transparent" : "#F0FDFA",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = n.isRead ? "#FAFAFA" : "#E6FAF8")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = n.isRead ? "transparent" : "#F0FDFA")
                    }
                  >
                    {/* Icon */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: n.title.includes("Status") ? "#DBEAFE" : "#F0FDFA",
                      }}
                    >
                      {n.title.includes("Status") ? (
                        <svg className="w-4 h-4" fill="none" stroke="#0992C2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="#0D9488" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: "#111827" }}
                        >
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: "#0D9488" }}
                          />
                        )}
                      </div>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "#6B7280" }}
                      >
                        {n.body}
                      </p>
                      <p
                        className="text-xs mt-1.5"
                        style={{ color: "#9CA3AF" }}
                      >
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              className="px-5 py-3 text-center"
              style={{ borderTop: "1px solid #F3F4F6" }}
            >
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Showing last {Math.min(notifications.length, 50)} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
