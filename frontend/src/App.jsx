import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

// partner pages
import PartnerLoginPage from "./pages/partner/LoginPage";
import DashboardPage from "./pages/partner/DashboardPage";
import KitchenPage from "./pages/partner/KitchenPage";
import AnalyticsPage from "./pages/partner/AnalyticsPage";

// user pages
import UserLoginPage from "./pages/user/LoginPage";
import ReelsPage from "./pages/user/ReelsPage";
import ExplorePage from "./pages/user/ExplorePage";
import ChatbotPage from "./pages/user/ChatbotPage";
import OrderStatusPage from "./pages/user/OrderStatusPage";

const ProtectedRoute = ({ children, role }) => {
  const { accessToken, role: userRole } = useAuthStore();
  if (!accessToken)
    return (
      <Navigate to={role === "partner" ? "/partner/login" : "/login"} replace />
    );
  if (role && userRole !== role) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* user auth */}
        <Route path="/login" element={<UserLoginPage />} />

        {/* user app */}
        <Route
          path="/"
          element={
            <ProtectedRoute role="user">
              <ReelsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore"
          element={
            <ProtectedRoute role="user">
              <ExplorePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute role="user">
              <ChatbotPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute role="user">
              <OrderStatusPage />
            </ProtectedRoute>
          }
        />

        {/* partner auth */}
        <Route path="/partner/login" element={<PartnerLoginPage />} />

        {/* partner app */}
        <Route
          path="/partner"
          element={
            <ProtectedRoute role="partner">
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/kitchen"
          element={
            <ProtectedRoute role="partner">
              <KitchenPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/analytics"
          element={
            <ProtectedRoute role="partner">
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
