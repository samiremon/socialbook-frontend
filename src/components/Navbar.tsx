import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-blue-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="text-xl font-bold tracking-wide flex items-center gap-2 hover:opacity-90">
          <span className="bg-white text-blue-600 px-2 py-0.5 rounded font-black text-lg">S</span>
          SocialApp
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-5 font-medium text-sm">
          <Link to="/" className="hover:text-blue-200 transition-colors">
            Feed
          </Link>
          <Link to="/messages" className="hover:text-blue-200 transition-colors">
            Messages
          </Link>
          {user ? (
            <Link to={`/profile/${user.id}`} className="hover:text-blue-200 transition-colors">
              My Profile ({user.fullName.split(' ')[0]})
            </Link>
          ) : (
            <Link to="/login" className="hover:text-blue-200 transition-colors">
              Login
            </Link>
          )}

          {user && (
            <button
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
