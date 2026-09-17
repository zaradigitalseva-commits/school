```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';

import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

// =========================================================
// PUBLIC PAGES
// =========================================================

import HomePage from '@/pages/public/HomePage';
import AboutPage from '@/pages/public/AboutPage';
import AcademicsPage from '@/pages/public/AcademicsPage';
import TeachersPage from '@/pages/public/TeachersPage';
import NoticesPage from '@/pages/public/NoticesPage';
import EventsPage from '@/pages/public/EventsPage';
import ContactPage from '@/pages/public/ContactPage';

// =========================================================
// AUTH
// =========================================================

import LoginPage from '@/pages/LoginPage';

// =========================================================
// MULTI-SCHOOL
// =========================================================

import RegisterSchoolPage from '@/pages/RegisterSchoolPage';
import SchoolsPage from '@/pages/SchoolsPage';
import SchoolPublicPage from '@/pages/SchoolPublicPage';

// =========================================================
// PAYMENT
// =========================================================

import PaymentRechargePage from '@/pages/PaymentRechargePage';

// =========================================================
// PLATFORM ADMIN
// =========================================================

import PlatformAdminPage from '@/pages/PlatformAdminPage';

// =========================================================
// SCHOOL ADMIN
// =========================================================

import SchoolAdminPage from '@/pages/SchoolAdminPage';

// =========================================================
// OLD / EXISTING DASHBOARD PAGES
// =========================================================

import OverviewPage from '@/pages/dashboard/OverviewPage';
import SchoolInfoPage from '@/pages/dashboard/SchoolInfoPage';
import AnnouncementsPage from '@/pages/dashboard/AnnouncementsPage';
import EventsPageDash from '@/pages/dashboard/EventsPage';
import TeachersPageDash from '@/pages/dashboard/TeachersPage';
import UsersPage from '@/pages/dashboard/UsersPage';
import FacultyAccessPage from '@/pages/dashboard/FacultyAccessPage';
import AdminAccessPage from '@/pages/dashboard/AdminAccessPage';

// =========================================================
// TEACHER DASHBOARD
// =========================================================
//
// IMPORTANT:
// Create this file:
// src/pages/TeacherDashboardPage.tsx
//
// Teacher will be restricted to role === "teacher".
// Tenant/class restrictions should be handled inside that page
// using the teacher's ACTIVE schoolMembership assignments.
//

import TeacherDashboardPage from '@/pages/TeacherDashboardPage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>

            {/* =================================================
                PUBLIC PLATFORM / SCHOOL WEBSITE
            ================================================= */}

            <Route element={<PublicLayout />}>

              <Route
                path="/"
                element={<HomePage />}
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

            </Route>

            {/* =================================================
                GOOGLE LOGIN
            ================================================= */}

            <Route
              path="/login"
              element={<LoginPage />}
            />

            {/* =================================================
                SCHOOL REGISTRATION
            ================================================= */}

            <Route
              path="/register-school"
              element={<RegisterSchoolPage />}
            />

            {/* =================================================
                PUBLIC SCHOOL DIRECTORY
            ================================================= */}

            <Route
              path="/schools"
              element={<SchoolsPage />}
            />

            {/* =================================================
                INDIVIDUAL SCHOOL PUBLIC WEBSITE

                Example:
                /school/abc-public-school
            ================================================= */}

            <Route
              path="/school/:slug"
              element={<SchoolPublicPage />}
            />

            {/* =================================================
                SCHOOL PAYMENT / RECHARGE
            ================================================= */}

            <Route
              path="/payment/recharge"
              element={<PaymentRechargePage />}
            />

            {/* =================================================
                SUPER ADMIN / PLATFORM ADMIN
                ONLY:
                ngogrant454@gmail.com

                AuthContext must resolve this account as:
                platform_admin
            ================================================= */}

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

            {/* =================================================
                SCHOOL ADMIN

                Only ACTIVE school_admin accounts.

                SchoolAdminPage itself determines the logged-in
                user's schoolMembership and loads only that school.
            ================================================= */}

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

            {/* =================================================
                TEACHER DASHBOARD

                Teacher is NOT allowed into the Super Admin
                dashboard.

                Only:
                role === "teacher"
            ================================================= */}

            <Route
              path="/teacher"
              element={
                <ProtectedRoute
                  allowedRoles={['teacher']}
                >
                  <TeacherDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* =================================================
                EXISTING PLATFORM DASHBOARD
                PLATFORM ADMIN ONLY

                These old dashboard pages are kept so existing
                project code does not break.

                They are NOT used by School Admin or Teacher.
            ================================================= */}

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

            {/* =================================================
                PLATFORM SCHOOL INFO
            ================================================= */}

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

            {/* =================================================
                PLATFORM ANNOUNCEMENTS
            ================================================= */}

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

            {/* =================================================
                PLATFORM EVENTS
            ================================================= */}

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

            {/* =================================================
                PLATFORM TEACHERS
            ================================================= */}

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

            {/* =================================================
                PLATFORM REGISTERED USERS
            ================================================= */}

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

            {/* =================================================
                PLATFORM FACULTY ACCESS
            ================================================= */}

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

            {/* =================================================
                PLATFORM ADMIN ACCESS
            ================================================= */}

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

            {/* =================================================
                FALLBACK
            ================================================= */}

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
