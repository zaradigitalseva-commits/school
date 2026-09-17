```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from '@/context/AuthContext';

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* =========================================
              PUBLIC WEBSITE
          ========================================= */}

          <Route element={<PublicLayout />}>

            <Route
              path="/"
              element={<PlatformHomePage />}
            />

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

            <Route
              path="/login"
              element={<LoginPage />}
            />

            <Route
              path="/register-school"
              element={<RegisterSchoolPage />}
            />

            <Route
              path="/schools"
              element={<SchoolsPage />}
            />

            <Route
              path="/school/:slug"
              element={<SchoolPublicPage />}
            />

          </Route>

          {/* =========================================
              PAYMENT / RECHARGE
          ========================================= */}

          <Route
            path="/payment/recharge"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'school_admin',
                  'platform_admin',
                ]}
              >
                <PaymentRechargePage />
              </ProtectedRoute>
            }
          />

          {/* =========================================
              PLATFORM ADMIN
          ========================================= */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'platform_admin',
                ]}
              >
                <PlatformAdminPage />
              </ProtectedRoute>
            }
          />

          {/* =========================================
              SCHOOL ADMIN
          ========================================= */}

          <Route
            path="/school-admin"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'school_admin',
                ]}
              >
                <SchoolAdminPage />
              </ProtectedRoute>
            }
          />

          {/* =========================================
              FALLBACK
          ========================================= */}

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

/*
 * IMPORTANT:
 * main.tsx में:
 *
 * import App from './App.tsx';
 *
 * इसलिए App का DEFAULT EXPORT जरूरी है।
 */
export default App;
```
