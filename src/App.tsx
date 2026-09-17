import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/use-toast';

import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
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

import OverviewPage from '@/pages/dashboard/OverviewPage';
import StudentsPage from '@/pages/dashboard/StudentsPage';
import TeachersDashboardPage from '@/pages/dashboard/TeachersPage';
import ClassesPage from '@/pages/dashboard/ClassesPage';
import HomeworkPage from '@/pages/dashboard/HomeworkPage';
import ResultsPage from '@/pages/dashboard/ResultsPage';
import AttendancePage from '@/pages/dashboard/AttendancePage';
import DashboardNoticesPage from '@/pages/dashboard/NoticesPage';
import DashboardEventsPage from '@/pages/dashboard/EventsPage';
import GalleryPage from '@/pages/dashboard/GalleryPage';
import DocumentsPage from '@/pages/dashboard/DocumentsPage';

export default function App() {
return ( <BrowserRouter> <AuthProvider> <ToastProvider> <Routes>

```
        {/* =========================
            PUBLIC PLATFORM PAGES
        ========================== */}

        <Route
          element={<PublicLayout />}
        >
          <Route path="/" element={<PlatformHomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/academics" element={<AcademicsPage />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/notices" element={<NoticesPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/contact" element={<ContactPage />} />

          <Route path="/login" element={<LoginPage />} />

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


        {/* =========================
            PAYMENT
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
            SUPER PLATFORM ADMIN
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
            Only own school
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
            LEGACY DASHBOARD
            Keep old dashboard working
            for Platform Admin only
        ========================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['platform_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="teachers" element={<TeachersDashboardPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="homework" element={<HomeworkPage />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="notices" element={<DashboardNoticesPage />} />
          <Route path="events" element={<DashboardEventsPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="documents" element={<DocumentsPage />} />
        </Route>


        {/* =========================
            UNKNOWN URL
        ========================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </ToastProvider>
  </AuthProvider>
</BrowserRouter>
```

);
}
