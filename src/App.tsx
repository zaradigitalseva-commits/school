import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider } from '@/context/AuthContext';

import PublicLayout from '@/components/layout/PublicLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

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

// =====================================================
// ADVERTISEMENT ADMIN
// =====================================================
import AdvertisementAdminPage from '@/pages/admin/AdvertisementAdminPage';

// =====================================================
// SUPER ADMIN SCHOOL DATA VIEWER
// =====================================================
import SchoolSuperAdminViewPage from '@/pages/SchoolSuperAdminViewPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* =====================================================
              PUBLIC WEBSITE
          ===================================================== */}

          <Route element={<PublicLayout />}>

            {/* PLATFORM HOME */}
            <Route
              path="/"
              element={<HomePage />}
            />

            {/* MAIN PAGES */}
            <Route
              path="/about"
              element={<AboutPage />}
            />

            <Route
              path="/academics"
              element={<AcademicsPage />}
            />

            <Route
              path="/teachers"
              element={<TeachersPage />}
            />

            <Route
              path="/notices"
              element={<NoticesPage />}
            />

            <Route
              path="/events"
              element={<EventsPage />}
            />

            <Route
              path="/contact"
              element={<ContactPage />}
            />

            {/* =================================================
                LEGAL / POLICY
            ================================================== */}

            <Route
              path="/privacy-policy"
              element={<PrivacyPolicyPage />}
            />

            <Route
              path="/terms-conditions"
              element={<TermsConditionsPage />}
            />

            <Route
              path="/refund-cancellation"
              element={<RefundCancellationPage />}
            />

            {/* =================================================
                LOGIN / SCHOOL REGISTRATION
            ================================================== */}

            <Route
              path="/login"
              element={<LoginPage />}
            />

            <Route
              path="/register-school"
              element={<RegisterSchoolPage />}
            />

            {/* =================================================
                SCHOOLS
            ================================================== */}

            <Route
              path="/schools"
              element={<SchoolsPage />}
            />

            <Route
              path="/school/:slug"
              element={<SchoolPublicPage />}
            />

          </Route>


          {/* =====================================================
              PAYMENT / RECHARGE
              School Admin + Platform Admin
          ===================================================== */}

          <Route
            path="/payment/recharge"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'user',
                  'school_admin',
                  'platform_admin',
                ]}
              >
                <PaymentRechargePage />
              </ProtectedRoute>
            }
          />


          {/* =====================================================
              ADVERTISEMENT ADMIN
              Platform Admin Only

              IMPORTANT:
              This route is BEFORE /admin
          ===================================================== */}

          <Route
            path="/admin/advertisements"
            element={
              <ProtectedRoute
                allowedRoles={['platform_admin']}
              >
                <AdvertisementAdminPage />
              </ProtectedRoute>
            }
          />


          {/* =====================================================
              PLATFORM / SUPER ADMIN
              Platform Admin Only
          ===================================================== */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute
                allowedRoles={['platform_admin']}
              >
                <PlatformAdminPage />
              </ProtectedRoute>
            }
          />


          {/* =====================================================
              SUPER ADMIN - FULL SCHOOL DATA
              Platform Admin Only
          ===================================================== */}

          <Route
            path="/admin/school/:schoolId"
            element={
              <ProtectedRoute
                allowedRoles={['platform_admin']}
              >
                <SchoolSuperAdminViewPage />
              </ProtectedRoute>
            }
          />


          {/* =====================================================
              SCHOOL ADMIN
              School-specific dashboard
          ===================================================== */}

          <Route
            path="/school-admin"
            element={
              <ProtectedRoute
                allowedRoles={['school_admin']}
              >
                <SchoolAdminPage />
              </ProtectedRoute>
            }
          />


          {/* =====================================================
              UNKNOWN URL
              Redirect to Platform Home
          ===================================================== */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
