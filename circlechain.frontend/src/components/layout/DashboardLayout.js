import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Dashboard Layout component with sidebar navigation and header
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} props.title - Page title
 * @param {Array} props.navigationItems - Navigation menu items
 */
const DashboardLayout = ({ children, title, navigationItems = [] }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleColor = (role) => {
    const colors = {
      consumer: 'bg-blue-100 text-blue-800',
      producer: 'bg-green-100 text-green-800',
      recycler: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
    };
    return colors[role] || 'bg-secondary-100 text-secondary-800';
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'consumer':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v-1a4 4 0 118 0v1m-4 0h.01M12 11h.01M8 11h.01" />
          </svg>
        );
      case 'producer':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      case 'recycler':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'admin':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Sidebar for mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl">
          <div className="flex items-center justify-between h-16 px-6 bg-primary-600">
            <h1 className="text-xl font-semibold text-white">CircleChain</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:text-secondary-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="mt-6 px-3">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md mb-2 transition-colors duration-200 ${
                  location.pathname === item.path
                    ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white shadow-sm">
          <div className="flex items-center h-16 px-6 bg-primary-600">
            <h1 className="text-xl font-semibold text-white">CircleChain</h1>
          </div>
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
            <nav className="px-3 space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="flex items-center justify-between h-16 bg-white shadow-sm px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-secondary-500 hover:text-secondary-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="ml-4 lg:ml-0 text-xl font-semibold text-secondary-900">{title}</h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* User role badge */}
            {user && (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                <span className="mr-1">{getRoleIcon(user.role)}</span>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </div>
            )}

            {/* User menu */}
            <div className="relative">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-secondary-900">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
                  title="Sign out"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;