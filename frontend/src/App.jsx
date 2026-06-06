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
import CartPage from "./pages/user/CartPage";
import OrdersListPage from "./pages/user/OrderListPage";
import StorePage from "./pages/user/StorePage";
import ProfilePage from "./pages/user/ProfilePage";
import PaymentPage from "./pages/user/PaymentPage";
import ReviewPage from "./pages/user/ReviewPage";

const ProtectedRoute = ({ children, role }) => {
  const { accessToken, role: userRole } = useAuthStore();

  if (!accessToken) {
    return (
      <Navigate to={role === "partner" ? "/partner/login" : "/login"} replace />
    );
  }
  if (role && userRole !== role) {
    // redirect to correct home based on actual role
    return (
      <Navigate to={userRole === "partner" ? "/partner" : "/feed"} replace />
    );
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── ROOT ──────────────────────────────────────────── */}
        <Route path="/" element={<RootRedirect />} />

        {/* ── USER AUTH ─────────────────────────────────────── */}
        <Route path="/login" element={<UserLoginPage />} />

        {/* ── USER APP ──────────────────────────────────────── */}
        <Route
          path="/feed"
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
          path="/cart"
          element={
            <ProtectedRoute role="user">
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute role="user">
              <OrdersListPage />
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
        <Route
          path="/store/:id"
          element={
            <ProtectedRoute role="user">
              <StorePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute role="user">
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute role="user">
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/review/:orderId"
          element={
            <ProtectedRoute role="user">
              <ReviewPage />
            </ProtectedRoute>
          }
        />

        {/* ── PARTNER AUTH ──────────────────────────────────── */}
        <Route path="/partner/login" element={<PartnerLoginPage />} />

        {/* ── PARTNER APP ───────────────────────────────────── */}
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

        {/* ── FALLBACK ──────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// redirects to correct home based on role
function RootRedirect() {
  const { accessToken, role } = useAuthStore();

  if (!accessToken) return <Navigate to="/login" replace />;
  if (role === "partner") return <Navigate to="/partner" replace />;
  return <Navigate to="/feed" replace />;
}
