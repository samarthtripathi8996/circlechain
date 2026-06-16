// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BlockchainProvider } from './context/BlockchainContext';
import { NotificationProvider, NotificationContainer } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ConsumerDashboard from './pages/dashboard/ConsumerDashboard';
import ProducerDashboard from './pages/dashboard/ProducerDashboard';
import RecyclerDashboard from './pages/dashboard/RecyclerDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import './index.css';

// Dashboard router component to route users to their role-specific dashboard
const DashboardRouter = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-secondary-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'consumer':
      return <ConsumerDashboard />;
    case 'producer':
      return <ProducerDashboard />;
    case 'recycler':
      return <RecyclerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return (
        <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-secondary-900 mb-2">Unknown Role</h2>
            <p className="text-secondary-600">Please contact support.</p>
          </div>
        </div>
      );
  }
};

const RootRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-secondary-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
};

function App() {
  return (
    <AuthProvider>
      <BlockchainProvider>
        <NotificationProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route 
                  path="/dashboard/*" 
                  element={
                    <ProtectedRoute>
                      <DashboardRouter />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/consumer/*" 
                  element={
                    <ProtectedRoute allowedRoles={['consumer']}>
                      <ConsumerDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/producer/*" 
                  element={
                    <ProtectedRoute allowedRoles={['producer']}>
                      <ProducerDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/recycler/*" 
                  element={
                    <ProtectedRoute allowedRoles={['recycler']}>
                      <RecyclerDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/*" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <NotificationContainer />
            </div>
          </Router>
        </NotificationProvider>
      </BlockchainProvider>
    </AuthProvider>
  );
}

export default App;
