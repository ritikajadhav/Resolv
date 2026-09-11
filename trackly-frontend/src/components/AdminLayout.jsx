import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/admin",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    path: "/admin/analytics",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "users",
    label: "Users",
    path: "/admin/users",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: "query",
    label: "Query AI",
    path: "/admin/query",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

export default function AdminLayout({
  children,
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search complaints, users, or insights...",
}) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fallbackSearch, setFallbackSearch] = useState("");

  const activeSearch = onSearchChange ? (searchTerm ?? "") : fallbackSearch;

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setFallbackSearch(val);
    }
  };

  const handleClear = () => {
    if (onSearchChange) {
      onSearchChange("");
    } else {
      setFallbackSearch("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !onSearchChange && fallbackSearch.trim()) {
      navigate(`/admin?search=${encodeURIComponent(fallbackSearch.trim())}`);
    }
  };

  // Match active nav by exact path (dashboard) or prefix (others)
  const activeId = navItems.find((item) =>
    item.path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(item.path)
  )?.id ?? "dashboard";

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "#F5F6F6", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      
      {/* ── Sidebar ── */}
      <aside
        className="flex-shrink-0 bg-white border-r flex flex-col transition-all duration-300"
        style={{ width: sidebarOpen ? "200px" : "60px", borderColor: "#E5E7EB" }}
      >
        {/* Toggle + Logo */}
        <div
          className="flex items-center border-b px-3 py-4 gap-3"
          style={{ borderColor: "#E5E7EB", minHeight: "60px" }}
        >
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ backgroundColor: "#F3F4F6" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E5E7EB")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
          >
            {sidebarOpen ? (
              <svg className="w-4 h-4" fill="none" stroke="#374151" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="#374151" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm whitespace-nowrap" style={{ color: "#111827" }}>
                Admin Panel
              </p>
              <p
                className="text-xs whitespace-nowrap"
                style={{ color: "#9CA3AF", fontSize: "0.6rem", letterSpacing: "0.08em" }}
              >
                ENTERPRISE SUITE
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const active = activeId === item.id;
            return (
              <Link
                key={item.id}
                to={item.path}
                title={!sidebarOpen ? item.label : undefined}
                className="w-full flex items-center rounded-xl transition-all"
                style={{
                  gap: sidebarOpen ? "10px" : "0",
                  padding: sidebarOpen ? "8px 10px" : "8px",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  backgroundColor: active ? "#F0FDFA" : "transparent",
                  color: active ? "#0D9488" : "#6B7280",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = "#F9FAFB";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {item.icon}
                {sidebarOpen && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 py-4 border-t" style={{ borderColor: "#E5E7EB" }}>
          <button
            onClick={logout}
            title={!sidebarOpen ? "Log out" : undefined}
            className="w-full flex items-center rounded-xl transition-all"
            style={{
              gap: sidebarOpen ? "10px" : "0",
              padding: sidebarOpen ? "8px 10px" : "8px",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              color: "#9CA3AF",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#FEF2F2";
              e.currentTarget.style.color = "#EF4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#9CA3AF";
            }}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">Log out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Nav */}
        <nav className="bg-white border-b sticky top-0 z-40" style={{ borderColor: "#E5E7EB" }}>
          <div className="px-8 py-3 flex items-center justify-between">
            <div className="relative">
              <svg
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                stroke="#9CA3AF"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={activeSearch}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="pl-9 pr-8 py-2 text-sm rounded-full outline-none transition-all focus:ring-2 focus:ring-teal-600 focus:bg-white"
                style={{
                  backgroundColor: "#F3F4F6",
                  border: "1px solid #E5E7EB",
                  width: "280px",
                  color: "#374151",
                }}
              />
              {activeSearch && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <UserMenu user={user} logout={logout} accentColor="#0D9488" />
            </div>
          </div>
        </nav>

        {/* Page content */}
        <div className="flex-1 px-8 py-8 overflow-auto">{children}</div>

        {/* Footer */}
        <footer className="border-t" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
          <div className="px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-6">
              {["Privacy Policy", "Terms of Service", "Accessibility Support", "Contact Admin"].map((l) => (
                <a
                  key={l}
                  href="#"
                  className="text-xs transition-colors"
                  style={{ color: "#9CA3AF" }}
                  onMouseEnter={(e) => (e.target.style.color = "#374151")}
                  onMouseLeave={(e) => (e.target.style.color = "#9CA3AF")}
                >
                  {l}
                </a>
              ))}
            </div>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              © 2026 RESOLV SYSTEMS.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
