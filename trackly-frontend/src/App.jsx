import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResidentDashboard from "./pages/ResidentDashboard";
import SubmitComplaintPage from "./pages/SubmitComplaintPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminQueryPage from "./pages/admin/AdminQueryPage";

const PrivateRoute = ({ children, adminOnly = false }) => {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "ADMIN") return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === "ADMIN" ? "/admin" : "/dashboard"} replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
      <Route path="/submit" element={<PrivateRoute><SubmitComplaintPage /></PrivateRoute>} />

      {/* Resident routes */}
      <Route path="/dashboard" element={<PrivateRoute><ResidentDashboard /></PrivateRoute>} />

      {/* Admin routes — each section is its own page */}
      <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboardPage /></PrivateRoute>} />
      <Route path="/admin/analytics" element={<PrivateRoute adminOnly><AdminAnalyticsPage /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute adminOnly><AdminUsersPage /></PrivateRoute>} />
      <Route path="/admin/query" element={<PrivateRoute adminOnly><AdminQueryPage /></PrivateRoute>} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={user ? (user.role === "ADMIN" ? "/admin" : "/dashboard") : "/login"} replace />} />
    </Routes>
  );
}

