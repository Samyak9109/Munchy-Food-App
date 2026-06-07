import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import UserLayout from './layouts/UserLayout';
import PartnerLayout from './layouts/PartnerLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import ReelsPage from './pages/user/ReelsPage';
import KitchensPage from './pages/user/KitchensPage';
import ChatbotPage from './pages/user/ChatbotPage';
import CartPage from './pages/user/CartPage';
import OrdersPage from './pages/user/OrdersPage';
import StorePage from './pages/user/StorePage';
import CheckoutPage from './pages/user/CheckoutPage';
import OrderDetailPage from './pages/user/OrderDetailPage';
import ProfilePage from './pages/user/ProfilePage';
import ForgotPasswordPage from './pages/user/ForgotPasswordPage';

import DashboardPage from './pages/partner/DashboardPage';
import PartnerOrdersPage from './pages/partner/PartnerOrdersPage';
import PartnerReelsPage from './pages/partner/PartnerReelsPage';
import AnalyticsPage from './pages/partner/AnalyticsPage';
import StoreManagePage from './pages/partner/StoreManagePage';
import OTPVerifyPage from './pages/partner/OTPVerifyPage';

import ProtectedRoute from './components/common/ProtectedRoute';

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* AUTH */}
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/register"         element={<RegisterPage />} />
          <Route path="/forgot-password"  element={<ForgotPasswordPage />} />

          {/* USER APP */}
          <Route element={
            <ProtectedRoute requiredRole="user">
              <UserLayout />
            </ProtectedRoute>
          }>
            <Route path="/"           element={<ReelsPage />} />
            <Route path="/kitchens"   element={<KitchensPage />} />
            <Route path="/chatbot"    element={<ChatbotPage />} />
            <Route path="/cart"       element={<CartPage />} />
            <Route path="/orders"     element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/store/:id"  element={<StorePage />} />
            <Route path="/checkout"   element={<CheckoutPage />} />
            <Route path="/profile"    element={<ProfilePage />} />
          </Route>

          {/* PARTNER APP */}
          <Route path="/partner" element={
            <ProtectedRoute requiredRole="partner">
              <PartnerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/partner/dashboard" replace />} />
            <Route path="dashboard"       element={<DashboardPage />} />
            <Route path="orders"          element={<PartnerOrdersPage />} />
            <Route path="orders/:orderId" element={<OTPVerifyPage />} />
            <Route path="reels"           element={<PartnerReelsPage />} />
            <Route path="analytics"       element={<AnalyticsPage />} />
            <Route path="store"           element={<StoreManagePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
