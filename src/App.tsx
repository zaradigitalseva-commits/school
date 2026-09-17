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

            {/* PUBLIC PLATFORM */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/academics" element={<AcademicsPage />} />
              <Route path="/teachers" element={<TeachersPage />} />
              <Route path="/notices" element={<NoticesPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

            {/* LOGIN */}
            <Route path="/login" element={<LoginPage />} />

            {/* SCHOOL REGISTRATION */}
            <Route
              path="/register-school"
              element={<RegisterSchoolPage />}
            />

            {/* SCHOOL DIRECTORY */}
            <Route
              path="/schools"
              element={<SchoolsPage />}
            />

            {/* PUBLIC SCHOOL WEBSITE */}
            <Route
              path="/school/:slug"
              element={<SchoolPublicPage />}
            />

            {/* PAYMENT */}
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

            {/* SUPER PLATFORM ADMIN */}
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

            {/* SCHOOL ADMIN */}
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

            {/* PLATFORM ADMIN DASHBOARD */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute
                  allowedRoles={['platform_admin']}
                >
                  <DashboardLayout>
                    <OverviewPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/school"
              element={
                <ProtectedRoute
                  allowedRoles={['platform_admin']}
                >
                  <DashboardLayout>
                    <SchoolInfoPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/announcements"
              element={
                <ProtectedRoute
                  allowedRoles={['platform_admin']}
                >
                  <DashboardLayout>
                    <AnnouncementsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/events"
              element={
                <ProtectedRoute
                  allowedRoles={['platform_admin']}
                >
                  <DashboardLayout>
                    <EventsPageDash />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/teachers"
              element={
                <ProtectedRoute
                  allowedRoles={['platform_admin']}
                >
                  <DashboardLayout>
                    <TeachersPageDash />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/users"
              element={
                <ProtectedRoute
                  allowedRoles={['platform_admin']}
                >
                  <DashboardLayout>
                    <UsersPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/faculty"
              element={
                <ProtectedRoute
                  allowedRoles={['platform_admin']}
                >
                  <DashboardLayout>
                    <FacultyAccessPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/admins"
              element={
                <ProtectedRoute
                  allowedRoles={['platform_admin']}
                >
                  <DashboardLayout>
                    <AdminAccessPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* UNKNOWN URL */}
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
