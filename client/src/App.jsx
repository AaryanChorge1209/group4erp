import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppLayout from './components/layout/AppLayout';

// Auth & Errors
import Login from './pages/Login';
import NotFound from './pages/errors/NotFound';
import Unauthorized from './pages/errors/Unauthorized';

// Dashboards
import AdminDashboard from './pages/dashboards/AdminDashboard';
import LibrarianDashboard from './pages/dashboards/LibrarianDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import PlacementDashboard from './pages/dashboards/PlacementDashboard';
import CompanyDashboard from './pages/dashboards/CompanyDashboard';
import AlumniDashboard from './pages/dashboards/AlumniDashboard';

// Library Module
import BookCatalog from './pages/library/BookCatalog';
import BookDetail from './pages/library/BookDetail';
import Checkout from './pages/library/Checkout';
import Return from './pages/library/Return';
import IssueList from './pages/library/IssueList';
import OverdueList from './pages/library/OverdueList';
import FineManagement from './pages/library/FineManagement';
import Reservations from './pages/library/Reservations';
import DigitalLibrary from './pages/library/DigitalLibrary';
import OPAC from './pages/library/OPAC';
import LibraryReports from './pages/library/LibraryReports';

// Placement Module
import Companies from './pages/placement/Companies';
import CompanyDetail from './pages/placement/CompanyDetail';
import Drives from './pages/placement/Drives';
import DriveDetail from './pages/placement/DriveDetail';
import Applications from './pages/placement/Applications';
import PlacementReports from './pages/placement/PlacementReports';

// Alumni Module
import AlumniDirectory from './pages/alumni/AlumniDirectory';
import AlumniDetail from './pages/alumni/AlumniDetail';
import Mentorship from './pages/alumni/Mentorship';
import Donations from './pages/alumni/Donations';

// Admin & Settings
import Users from './pages/admin/Users';
import AuditLogs from './pages/admin/AuditLogs';
import Settings from './pages/admin/Settings';
import RolePermissions from './pages/admin/RolePermissions';

// Shared
import NotificationCenter from './pages/notifications/NotificationCenter';
import Profile from './pages/profile/Profile';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-navy-900">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-9 w-9 rounded-full border-4 border-primary-600 border-t-transparent" />
          <p className="text-xs text-gray-500 font-medium">Verifying Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

function DashboardRedirect() {
  const { user } = useAuth();
  const routes = {
    ADMIN: '/admin/dashboard',
    LIBRARIAN: '/library/dashboard',
    STUDENT: '/student/dashboard',
    PLACEMENT_OFFICER: '/placement/dashboard',
    COMPANY: '/company/dashboard',
    ALUMNI: '/alumni/dashboard'
  };

  return <Navigate to={routes[user?.role] || '/login'} replace />;
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                fontSize: '13px'
              }
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardRedirect />} />

              {/* Admin Routes */}
              <Route
                path="admin/dashboard"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/audit-logs"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/settings"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/roles"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <RolePermissions />
                  </ProtectedRoute>
                }
              />

              {/* Library Routes */}
              <Route
                path="library/dashboard"
                element={
                  <ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}>
                    <LibrarianDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="library/books"
                element={
                  <ProtectedRoute roles={['LIBRARIAN', 'ADMIN', 'STUDENT']}>
                    <BookCatalog />
                  </ProtectedRoute>
                }
              />
              <Route path="library/books/:id" element={<BookDetail />} />
              <Route
                path="library/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="library/return"
                element={
                  <ProtectedRoute>
                    <Return />
                  </ProtectedRoute>
                }
              />
              <Route
                path="library/issues"
                element={
                  <ProtectedRoute roles={['LIBRARIAN', 'ADMIN', 'STUDENT']}>
                    <IssueList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="library/overdue"
                element={
                  <ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}>
                    <OverdueList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="library/fines"
                element={
                  <ProtectedRoute roles={['LIBRARIAN', 'ADMIN', 'STUDENT']}>
                    <FineManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="library/reservations"
                element={
                  <ProtectedRoute roles={['LIBRARIAN', 'ADMIN', 'STUDENT']}>
                    <Reservations />
                  </ProtectedRoute>
                }
              />
              <Route path="library/digital" element={<DigitalLibrary />} />
              <Route path="library/opac" element={<OPAC />} />
              <Route
                path="reports/library"
                element={
                  <ProtectedRoute roles={['ADMIN', 'LIBRARIAN']}>
                    <LibraryReports />
                  </ProtectedRoute>
                }
              />

              {/* Student Routes */}
              <Route
                path="student/dashboard"
                element={
                  <ProtectedRoute roles={['STUDENT']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="student/books" element={<IssueList />} />
              <Route path="student/fines" element={<FineManagement />} />
              <Route path="student/reservations" element={<Reservations />} />
              <Route path="student/applications" element={<Applications />} />

              {/* Placement Routes */}
              <Route
                path="placement/dashboard"
                element={
                  <ProtectedRoute roles={['PLACEMENT_OFFICER', 'ADMIN']}>
                    <PlacementDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="placement/companies" element={<Companies />} />
              <Route path="placement/companies/:id" element={<CompanyDetail />} />
              <Route path="placement/drives" element={<Drives />} />
              <Route path="placement/drives/:id" element={<DriveDetail />} />
              <Route path="placement/applications" element={<Applications />} />
              <Route
                path="reports/placement"
                element={
                  <ProtectedRoute roles={['ADMIN', 'PLACEMENT_OFFICER']}>
                    <PlacementReports />
                  </ProtectedRoute>
                }
              />

              {/* Company Routes */}
              <Route
                path="company/dashboard"
                element={
                  <ProtectedRoute roles={['COMPANY']}>
                    <CompanyDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Alumni Routes */}
              <Route
                path="alumni/dashboard"
                element={
                  <ProtectedRoute roles={['ALUMNI']}>
                    <AlumniDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="alumni/directory" element={<AlumniDirectory />} />
              <Route path="alumni/mentorship" element={<Mentorship />} />
              <Route path="alumni/donations" element={<Donations />} />
              <Route path="alumni/:id" element={<AlumniDetail />} />

              {/* Shared Routes */}
              <Route path="notifications" element={<NotificationCenter />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
