import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useToastStore } from '/home/samarth-tripathi/circlechain/circlechain.frontend/src/stores/toastStore';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from '/home/samarth-tripathi/circlechain/circlechain.frontend/src/components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ProducerDashboard from './components/dashboard/ProducerDashboard';
import ConsumerDashboard from './components/dashboard/ConsumerDashboard';
import RecyclerDashboard from './components/dashboard/RecyclerDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import ProductMarketplace from './components/marketplace/ProductMarketplace';
import RecycleMarketplace from '/home/samarth-tripathi/circlechain/circlechain.frontend/src/components/marketplace/RecycleMarketplace';
import MaterialsMarketplace from './components/marketplace/MaterialsMarketplace';
import Navigation from './components/Navigation';

const App: React.FC = () => {
  const { initializeAuth, user } = useAuthStore();
  const { toasts, removeToast } = useToastStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const renderDashboard = () => {
    if (!user) return <Navigate to="/login" replace />;
    
    switch (user.role) {
      case 'producer':
        return <ProducerDashboard />;
      case 'consumer':
        return <ConsumerDashboard />;
      case 'recycler':
        return <RecyclerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <Navigate to="/login" replace />;
    }
  };

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-100">
          {user && <Navigation />}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={renderDashboard()} />
            <Route
              path="/marketplace/products"
              element={
                <ProtectedRoute>
                  <ProductMarketplace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketplace/recycle"
              element={
                <ProtectedRoute>
                  <RecycleMarketplace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketplace/materials"
              element={
                <ProtectedRoute>
                  <MaterialsMarketplace />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          
          {/* Toast notifications */}
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;