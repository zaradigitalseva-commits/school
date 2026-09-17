```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

import HomePage from '@/pages/public/HomePage';
import AboutPage from '@/pages/public/AboutPage';
import AcademicsPage from '@/pages/public/AcademicsPage';
import TeachersPage from '@/pages/public/TeachersPage';
import NoticesPage from '@/pages/public/NoticesPage';
import EventsPage from '@/pages/public/EventsPage';
import ContactPage from '@/pages/public/ContactPage';
import LoginPage from '@/pages/LoginPage';

import RegisterSchoolPage from '@/pages/RegisterSchoolPage';
import SchoolsPage from '@/pages/SchoolsPage';
import SchoolPublicPage from '@/pages/SchoolPublicPage';
import PaymentRechargePage from '@/pages/PaymentRechargePage';
import PlatformAdminPage from '@/pages/PlatformAdminPage';
import SchoolAdminPage from '@/pages/SchoolAdminPage';

import OverviewPage from '@/pages/dashboard/OverviewPage';
import SchoolInfoPage from '@/pages/dashboard/SchoolInfoPage';
import AnnouncementsPage from '@/pages/dashboard/AnnouncementsPage';
import EventsPageDash from '@/pages/dashboard/EventsPage';
import TeachersPageDash from '@/pages/dashboard/TeachersPage';
import UsersPage from '@/pages/dashboard/UsersPage';
import FacultyAccessPage from '@/pages/dashboard/FacultyAccessPage';
import AdminAccessPage from '@/pages/dashboard/AdminAccessPage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>

            {/* =========================
                PUBLIC PLATFORM PAGES
            ========================== */}

            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/academics" element={<AcademicsPage />} />
              <Route path="/teachers" element={<TeachersPage />} />
              <Route path="/notices" element={<NoticesPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

            {/* =========================
                AUTH
            ========================== */}

            <Route path="/login" element={<LoginPage />} />

            {/* =========================
                SCHOOL REGISTRATION
            ========================== */}

            <Route
              path="/register-school"
              element={<RegisterSchoolPage />}
            />

            {/* =========================
                PUBLIC SCHOOL DIRECTORY
            ========================== */}

            <Route
              path="/schools"
              element={<SchoolsPage />}
            />

            {/* =========================
                INDIVIDUAL SCHOOL WEBSITE
            ========================== */}

            <Route
              path="/school/:slug"
              element={<SchoolPublicPage />}
            />

            {/* =========================
                PAYMENT / RECHARGE
            ========================== */}

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

            {/* =========================
                SUPER PLATFORM ADMIN
                ngogrant454@gmail.com
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
                SCHOOL ADMIN
                ONLY THEIR OWN SCHOOL
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
                PLATFORM ADMIN DASHBOARD
                LEGACY / INTERNAL PAGES
            ========================== */}

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['platform_admin']}
                >
                  <DashboardLayout>
                    <OverviewPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
              path="/dashboard"
            />

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['platform_admin']}
                >
                  <DashboardLayout>
                    <SchoolInfoPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
              path="/dashboard/school"
            />

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['platform_admin']}
                >
                  <DashboardLayout>
                    <AnnouncementsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
              path="/dashboard/announcements"
            />

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['platform_admin']}
                >
                  <DashboardLayout>
                    <EventsPageDash />
                  </DashboardLayout>
                </ProtectedRoute>
              }
              path="/dashboard/events"
            />

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['platform_admin']}
                >
                  <DashboardLayout>
                    <TeachersPageDash />
                  </DashboardLayout>
                </ProtectedRoute>
              }
              path="/dashboard/teachers"
            />

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['platform_admin']}
                >
                  <DashboardLayout>
                    <UsersPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
              path="/dashboard/users"
            />

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['platform_admin']}
                >
                  <DashboardLayout>
                    <FacultyAccessPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
              path="/dashboard/faculty"
            />

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['platform_admin']}
                >
                  <DashboardLayout>
                    <AdminAccessPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
              path="/dashboard/admins"
            />

            {/* =========================
                UNKNOWN URL
            ========================== */}

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />

          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
```
