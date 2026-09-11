import { useState, useRef, useEffect } from "react";

export default function UserMenu({ user, logout, accentColor = "#374151" }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const displayName = user?.name
    ? `${user.name} ${user.lastName || ""}`.trim()
    : user?.email?.split("@")[0] || "User";

  const initial = (user?.name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile avatar button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-600 shadow-sm cursor-pointer"
        style={{ backgroundColor: accentColor }}
        aria-label="User profile menu"
        aria-expanded={isOpen}
      >
        {initial}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-100"
          style={{
            boxShadow: "0 12px 30px -4px rgba(0, 0, 0, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* User Details */}
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-gray-900 truncate" title={displayName}>
                {displayName}
              </p>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  backgroundColor: user?.role === "ADMIN" ? "#F0FDFA" : "#F3F4F6",
                  color: user?.role === "ADMIN" ? "#0D9488" : "#4B5563",
                }}
              >
                {user?.role || "RESIDENT"}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate" title={user?.email}>
              {user?.email}
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 px-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
