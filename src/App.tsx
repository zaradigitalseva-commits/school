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
                PUBLIC SCHOOL WEBSITE
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
                AUTHENTICATION
            ========================== */}
            <Route path="/login" element={<LoginPage />} />

            {/* =========================
                MULTI-SCHOOL REGISTRATION
            ========================== */}
            <Route
              path="/register-school"
              element={<RegisterSchoolPage />}
            />

            {/* =========================
                PUBLIC LIVE SCHOOL DIRECTORY
            ========================== */}
            <Route
              path="/schools"
              element={<SchoolsPage />}
            />

            {/* =========================
                INDIVIDUAL SCHOOL PUBLIC PAGE
                Example:
                /school/abc-public-school
            ========================== */}
            <Route
              path="/school/:slug"
              element={<SchoolPublicPage />}
            />

            {/* =========================
                SCHOOL PAYMENT / RECHARGE
            ========================== */}
            <Route
              path="/payment/recharge"
              element={<PaymentRechargePage />}
            />

            {/* =========================
                PLATFORM ADMIN
                Only:
                ngogrant454@gmail.com
            ========================== */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <PlatformAdminPage />
                </ProtectedRoute>
              }
            />

            {/* =========================
                SCHOOL ADMIN
                Only ACTIVE school admins
            ========================== */}
            <Route
              path="/school-admin"
              element={
                <ProtectedRoute allowedRoles={['school_admin']}>
                  <SchoolAdminPage />
                </ProtectedRoute>
              }
            />

            {/* =========================
                OLD DASHBOARD
                Temporarily PLATFORM ADMIN ONLY
                until tenant-aware school modules
                are connected.
            ========================== */}

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <DashboardLayout>
                    <OverviewPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/school"
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <DashboardLayout>
                    <SchoolInfoPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/announcements"
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <DashboardLayout>
                    <AnnouncementsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/events"
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <DashboardLayout>
                    <EventsPageDash />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/teachers"
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <DashboardLayout>
                    <TeachersPageDash />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/users"
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <DashboardLayout>
                    <UsersPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/faculty"
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <DashboardLayout>
                    <FacultyAccessPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/admins"
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <DashboardLayout>
                    <AdminAccessPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* =========================
                FALLBACK
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
