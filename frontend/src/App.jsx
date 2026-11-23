import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import UserLayout from './layouts/UserLayout';
import PartnerLayout from './layouts/PartnerLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import ToastContainer from './components/common/ToastContainer';
import PageSkeleton from './components/common/PageSkeleton';
import ErrorBoundary from './components/common/ErrorBoundary';

// ── LAZY-LOADED AUTH PAGES ────────────────────────────────────
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const VerifyOTPPage = lazy(() => import('./pages/auth/VerifyOTPPage'));
const AuthSuccessPage = lazy(() => import('./pages/auth/AuthSuccessPage'));
const AuthErrorPage = lazy(() => import('./pages/auth/AuthErrorPage'));
const ForgotPasswordPage = lazy(() => import('./pages/user/ForgotPasswordPage'));

// ── LAZY-LOADED USER PAGES ────────────────────────────────────
const ReelsPage = lazy(() => import('./pages/user/ReelsPage'));
const KitchensPage = lazy(() => import('./pages/user/KitchensPage'));
const CartPage = lazy(() => import('./pages/user/CartPage'));
const OrdersPage = lazy(() => import('./pages/user/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/user/OrderDetailPage'));
const StorePage = lazy(() => import('./pages/user/StorePage'));
const CheckoutPage = lazy(() => import('./pages/user/CheckoutPage'));
const ProfilePage = lazy(() => import('./pages/user/ProfilePage'));

// ── LAZY-LOADED PARTNER PAGES ─────────────────────────────────
const DashboardPage = lazy(() => import('./pages/partner/DashboardPage'));
const PartnerOrdersPage = lazy(() => import('./pages/partner/PartnerOrdersPage'));
const PartnerReelsPage = lazy(() => import('./pages/partner/PartnerReelsPage'));
const AnalyticsPage = lazy(() => import('./pages/partner/AnalyticsPage'));
const StoreManagePage = lazy(() => import('./pages/partner/StoreManagePage'));
const OTPVerifyPage = lazy(() => import('./pages/partner/OTPVerifyPage'));
const PartnerProfilePage = lazy(() => import('./pages/partner/PartnerProfilePage'));

// ── QUERY CLIENT WITH PERFORMANCE TUNING (PERF-04) ────────────
const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Do not retry on 4xx client errors
        const status = error?.response?.status || error?.status;
        if (status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
      staleTime: 60 * 1000, // 1 min default
      gcTime: 10 * 60 * 1000, // 10 min cache garbage collection
      refetchOnWindowFocus: false, // Prevent background refetch storms
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <ToastContainer />
        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* AUTH */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-otp" element={<VerifyOTPPage />} />
              <Route path="/auth/success" element={<AuthSuccessPage />} />
              <Route path="/auth/error" element={<AuthErrorPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* USER APP */}
              <Route
                element={
                  <ProtectedRoute requiredRole="user">
                    <UserLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<ReelsPage />} />
                <Route path="/kitchens" element={<KitchensPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/store/:id" element={<StorePage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* PARTNER APP */}
              <Route
                path="/partner"
                element={
                  <ProtectedRoute requiredRole="partner">
                    <PartnerLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/partner/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="orders" element={<PartnerOrdersPage />} />
                <Route path="orders/:orderId" element={<OTPVerifyPage />} />
                <Route path="reels" element={<PartnerReelsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="store" element={<StoreManagePage />} />
                <Route path="profile" element={<PartnerProfilePage />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
