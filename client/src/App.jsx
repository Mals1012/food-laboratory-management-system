import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BatchesPage from './pages/BatchesPage';
import QualityTestingPage from './pages/QualityTestingPage';
import QAReviewPage from './pages/QAReviewPage';
import ExpiryMonitoringPage from './pages/ExpiryMonitoringPage';
import COAGenerationPage from './pages/COAGenerationPage';
import BatchTraceabilityPage from './pages/BatchTraceabilityPage';
import AuditTrailPage from './pages/AuditTrailPage';
import UserManagementPage from './pages/UserManagementPage';
import ProductSpecificationsPage from './pages/ProductSpecificationsPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role) && user?.role !== 'Admin') {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 max-w-md mx-auto mt-20 space-y-3">
        <h2 className="text-base font-bold text-slate-800">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          Your current role (<strong>{user?.role}</strong>) does not have privileges for this module.
        </p>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes inside Main Enterprise Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<Navigate to="/" replace />} />
              <Route path="batches" element={<BatchesPage />} />
              <Route path="batches/:id" element={<BatchesPage />} />
              <Route path="testing" element={<QualityTestingPage />} />
              <Route path="qa-review" element={<QAReviewPage />} />
              <Route path="expiry-monitoring" element={<ExpiryMonitoringPage />} />
              <Route path="coa" element={<COAGenerationPage />} />
              <Route path="traceability" element={<BatchTraceabilityPage />} />
              <Route path="specifications" element={<ProductSpecificationsPage />} />
              <Route path="audit-trail" element={<AuditTrailPage />} />
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
