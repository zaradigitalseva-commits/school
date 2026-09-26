import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider } from '@/context/AuthContext';

import PublicLayout from '@/components/layout/PublicLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardRedirect from '@/pages/DashboardRedirect';

// =====================================================
// PUBLIC PAGES
// =====================================================
import HomePage from '@/pages/public/HomePage';
import AboutPage from '@/pages/public/AboutPage';
import AcademicsPage from '@/pages/public/AcademicsPage';
import TeachersPage from '@/pages/public/TeachersPage';
import NoticesPage from '@/pages/public/NoticesPage';
import EventsPage from '@/pages/public/EventsPage';
import ContactPage from '@/pages/public/ContactPage';

// =====================================================
// POLICY PAGES
// =====================================================
import PrivacyPolicyPage from '@/pages/public/PrivacyPolicyPage';
import TermsConditionsPage from '@/pages/public/TermsConditionsPage';
import RefundCancellationPage from '@/pages/public/RefundCancellationPage';

// =====================================================
// AUTHENTICATION / SCHOOL PAGES
// =====================================================
import LoginPage from '@/pages/LoginPage';
import RegisterSchoolPage from '@/pages/RegisterSchoolPage';
import SchoolsPage from '@/pages/SchoolsPage';
import SchoolPublicPage from '@/pages/SchoolPublicPage';

// =====================================================
// PROTECTED PAGES
// =====================================================
import PaymentRechargePage from '@/pages/PaymentRechargePage';
import PlatformAdminPage from '@/pages/PlatformAdminPage';
import SchoolAdminPage from '@/pages/SchoolAdminPage';
import TeacherDashboardPage from '@/pages/TeacherDashboardPage';

// =====================================================
// ADVERTISEMENT ADMIN
// =====================================================
import AdvertisementManagerPage from '@/pages/admin/AdvertisementManagerPage';

// =====================================================
// SUPER ADMIN SCHOOL DATA VIEWER
// =====================================================
import SchoolSuperAdminViewPage from '@/pages/SchoolSuperAdminViewPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/academics" element={<AcademicsPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/notices" element={<NoticesPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/contact" element={<ContactPage />} />

            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-conditions" element={<TermsConditionsPage />} />
            <Route path="/refund-cancellation" element={<RefundCancellationPage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register-school" element={<RegisterSchoolPage />} />
            <Route path="/schools" element={<SchoolsPage />} />
            <Route path="/school/:slug" element={<SchoolPublicPage />} />
          </Route>

          <Route
            path="/payment/recharge"
            element={
              <ProtectedRoute allowedRoles={['user', 'school_admin', 'platform_admin']}>
                <PaymentRechargePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ad"
            element={
              <ProtectedRoute allowedRoles={['platform_admin']}>
                <AdvertisementManagerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/advertisements"
            element={
              <ProtectedRoute allowedRoles={['platform_admin']}>
                <AdvertisementManagerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['platform_admin']}>
                <PlatformAdminPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/school/:schoolId"
            element={
              <ProtectedRoute allowedRoles={['platform_admin']}>
                <SchoolSuperAdminViewPage />
              </ProtectedRoute>
            }
          />

          {/* UNIVERSAL DASHBOARD ENTRY
              /dashboard now works for every authorized role.
              It sends each role to its correct dashboard. */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={['platform_admin', 'school_admin', 'teacher']}
              >
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />

          {/* Teacher's actual dashboard */}
          <Route
            path="/dashboard/teacher"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'school_admin']}>
                <TeacherDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/school-admin"
            element={
              <ProtectedRoute allowedRoles={['school_admin']}>
                <SchoolAdminPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
