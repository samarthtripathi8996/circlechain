import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Role options based on the API specification
const ROLE_OPTIONS = [
  { value: 'consumer', label: 'Consumer', description: 'Browse and purchase eco-friendly products' },
  { value: 'producer', label: 'Producer', description: 'Create and sell sustainable products' },
  { value: 'recycler', label: 'Recycler', description: 'Process waste and create raw materials' },
];

const SignupPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const { signup, isLoading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts or form data changes
  useEffect(() => {
    clearError();
    setValidationErrors({});
  }, [clearError, formData]);

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Role validation
    if (!formData.role) {
      errors.role = 'Please select your role';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await signup({
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });
    
    if (result.success) {
      // Redirect to login with success message
      navigate('/login', { 
        state: { 
          message: 'Account created successfully! Please sign in to continue.',
          email: formData.email 
        } 
      });
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(prev => !prev);
    } else {
      setShowConfirmPassword(prev => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-secondary-900">
            Join CircleChain
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Create your account and start making a difference
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full px-4 py-3 border ${
                    validationErrors.email ? 'border-error-300' : 'border-secondary-300'
                  } placeholder-secondary-400 text-secondary-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-all duration-200`}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
              {validationErrors.email && (
                <p className="mt-2 text-sm text-error-600">{validationErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full px-4 py-3 border ${
                    validationErrors.password ? 'border-error-300' : 'border-secondary-300'
                  } placeholder-secondary-400 text-secondary-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-all duration-200`}
                  placeholder="Create a password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('password')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-2 text-sm text-error-600">{validationErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full px-4 py-3 border ${
                    validationErrors.confirmPassword ? 'border-error-300' : 'border-secondary-300'
                  } placeholder-secondary-400 text-secondary-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-all duration-200`}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="mt-2 text-sm text-error-600">{validationErrors.confirmPassword}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-3">
                Select your role
              </label>
              <div className="space-y-3">
                {ROLE_OPTIONS.map((option) => (
                  <div key={option.value} className="relative">
                    <input
                      id={option.value}
                      name="role"
                      type="radio"
                      value={option.value}
                      checked={formData.role === option.value}
                      onChange={handleInputChange}
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <label
                      htmlFor={option.value}
                      className={`relative block w-full p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.role === option.value
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50'
                      } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-5 h-5 rounded-full border-2 ${
                              formData.role === option.value
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-secondary-300'
                            } flex items-center justify-center`}
                          >
                            {formData.role === option.value && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-secondary-900">{option.label}</div>
                          <div className="text-sm text-secondary-500">{option.description}</div>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              {validationErrors.role && (
                <p className="mt-2 text-sm text-error-600">{validationErrors.role}</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-error-50 border border-error-200 p-4 animate-fade-in">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-error-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </div>
                ) : (
                  'Create account'
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-secondary-500">Already have an account?</span>
              </div>
            </div>

            {/* Sign in Link */}
            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
              >
                Sign in to your account
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-secondary-500">
            By creating an account, you agree to our{' '}
            <a href="https://www.google.com" className="text-primary-600 hover:text-primary-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="https://www.google.com" className="text-primary-600 hover:text-primary-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;