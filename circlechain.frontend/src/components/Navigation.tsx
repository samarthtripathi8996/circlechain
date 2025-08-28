import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getDashboardPath = () => {
    return '/dashboard';
  };

  // Role-based navigation items
  const getNavigationItems = () => {
    if (!user) return [];
    
    const commonItems = [
      { to: getDashboardPath(), label: 'Dashboard' },
      { to: "/marketplace/products", label: 'Products' },
    ];

    switch (user.role) {
      case 'consumer':
        return [
          ...commonItems,
          { to: "/marketplace/recycle", label: 'Recycle' },
          { to: "/marketplace/materials", label: 'Materials' },
        ];
      case 'producer':
        return [
          ...commonItems,
          { to: "/marketplace/materials", label: 'Purchase Materials' },
        ];
      case 'recycler':
        return [
          ...commonItems,
          { to: "/marketplace/recycle", label: 'Manage Recycling' },
          { to: "/marketplace/materials", label: 'Sell Materials' },
        ];
      case 'admin':
        return [
          ...commonItems,
          { to: "/marketplace/recycle", label: 'Recycle' },
          { to: "/marketplace/materials", label: 'Materials' },
          { to: "/admin/analytics", label: 'Analytics' },
        ];
      default:
        return commonItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="bg-green-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to={getDashboardPath()} className="text-xl font-bold">
            Circular Economy Marketplace
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="hover:text-green-200 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                Welcome, {user?.email} ({user?.role})
              </span>
              <button
                onClick={handleLogout}
                className="bg-green-700 hover:bg-green-800 px-3 py-1 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-3">
              {navigationItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="hover:text-green-200 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-green-500">
                <span className="block text-sm mb-2">
                  Welcome, {user?.email} ({user?.role})
                </span>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="bg-green-700 hover:bg-green-800 px-3 py-1 rounded-md transition-colors w-full text-left"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;