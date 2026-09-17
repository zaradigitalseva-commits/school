import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/use-toast';

import PublicLayout from '@/components/layout/PublicLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import PlatformHomePage from '@/pages/PlatformHomePage';
import AboutPage from '@/pages/AboutPage';
import AcademicsPage from '@/pages/AcademicsPage';
import TeachersPage from '@/pages/TeachersPage';
import NoticesPage from '@/pages/NoticesPage';
import EventsPage from '@/pages/EventsPage';
import ContactPage from '@/pages/ContactPage';

import LoginPage from '@/pages/LoginPage';
import RegisterSchoolPage from '@/pages/RegisterSchoolPage';
import SchoolsPage from '@/pages/SchoolsPage';
import SchoolPublicPage from '@/pages/SchoolPublicPage';

import PaymentRechargePage from '@/pages/PaymentRechargePage';
import PlatformAdminPage from '@/pages/PlatformAdminPage';
import SchoolAdminPage from '@/pages/SchoolAdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>

            {/* Public Pages */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<PlatformHomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/academics" element={<AcademicsPage />} />
              <Route path="/teachers" element={<TeachersPage />} />
              <Route path="/notices" element={<NoticesPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/contact" element={<ContactPage />} />

              <Route path="/login" element={<LoginPage />} />
              <Route path="/register-school" element={<RegisterSchoolPage />} />
              <Route path="/schools" element={<SchoolsPage />} />
              <Route path="/school/:slug" element={<SchoolPublicPage />} />
            </Route>

            {/* Payment / Recharge */}
            <Route
              path="/payment/recharge"
              element={
                <ProtectedRoute
                  allowedRoles={['school_admin', 'platform_admin']}
                >
                  <PaymentRechargePage />
                </ProtectedRoute>
              }
            />

            {/* Platform Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <PlatformAdminPage />
                </ProtectedRoute>
              }
            />

            {/* School Admin */}
            <Route
              path="/school-admin"
              element={
                <ProtectedRoute allowedRoles={['school_admin']}>
                  <SchoolAdminPage />
                </ProtectedRoute>
              }
            />

            {/* Unknown Route */}
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />

          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
