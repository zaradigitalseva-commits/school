```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';

import PublicLayout from '@/components/layout/PublicLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

// Public pages
import HomePage from '@/pages/public/HomePage';
import AboutPage from '@/pages/public/AboutPage';
import AcademicsPage from '@/pages/public/AcademicsPage';
import TeachersPage from '@/pages/public/TeachersPage';
import NoticesPage from '@/pages/public/NoticesPage';
import EventsPage from '@/pages/public/EventsPage';
import ContactPage from '@/pages/public/ContactPage';

// Policy pages
import PrivacyPolicyPage from '@/pages/public/PrivacyPolicyPage';
import TermsConditionsPage from '@/pages/public/TermsConditionsPage';
import RefundCancellationPage from '@/pages/public/RefundCancellationPage';

// Authentication / School pages
import LoginPage from '@/pages/LoginPage';
import RegisterSchoolPage from '@/pages/RegisterSchoolPage';
import SchoolsPage from '@/pages/SchoolsPage';
import SchoolPublicPage from '@/pages/SchoolPublicPage';

// Protected pages
import PaymentRechargePage from '@/pages/PaymentRechargePage';
import PlatformAdminPage from '@/pages/PlatformAdminPage';
import SchoolAdminPage from '@/pages/SchoolAdminPage';

// Super Admin school data viewer
import SchoolSuperAdminViewPage from '@/pages/SchoolSuperAdminViewPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* =========================
              PUBLIC WEBSITE
          ========================== */}
          <Route element={<PublicLayout />}>

            {/* Home */}
            <Route path="/" element={<HomePage />} />

            {/* Main Pages */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/academics" element={<AcademicsPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/notices" element={<NoticesPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Legal / Policy Pages */}
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

            {/* Login / Registration */}
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/register-school"
              element={<RegisterSchoolPage />}
            />

            {/* Schools */}
            <Route path="/schools" element={<SchoolsPage />} />

            <Route
              path="/school/:slug"
              element={<SchoolPublicPage />}
            />

          </Route>


          {/* =========================
              SCHOOL / PLATFORM PAYMENT
              Existing system kept
          ========================== */}
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


          {/* =========================
              PLATFORM ADMIN
          ========================== */}
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


          {/* =========================
              SUPER ADMIN - FULL SCHOOL DATA
              Platform admin only
          ========================== */}
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


          {/* =========================
              SCHOOL ADMIN
          ========================== */}
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


          {/* =========================
              INVALID URL
              Redirect to Home
          ========================== */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```
