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
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/academics" element={<AcademicsPage />} />
              <Route path="/teachers" element={<TeachersPage />} />
              <Route path="/notices" element={<NoticesPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

            {/* Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Dashboard routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <OverviewPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/school"
              element={
                <ProtectedRoute adminOnly>
                  <DashboardLayout>
                    <SchoolInfoPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/announcements"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AnnouncementsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/events"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <EventsPageDash />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/teachers"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TeachersPageDash />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/users"
              element={
                <ProtectedRoute adminOnly>
                  <DashboardLayout>
                    <UsersPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/faculty"
              element={
                <ProtectedRoute adminOnly>
                  <DashboardLayout>
                    <FacultyAccessPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admins"
              element={
                <ProtectedRoute adminOnly>
                  <DashboardLayout>
                    <AdminAccessPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
