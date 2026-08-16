import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Search, Sun, Moon, Bell, LogOut, User as UserIcon, Star, Bookmark, Menu } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300 border-b glass-panel dark:border-dark-border light:border-light-border dark:bg-dark-bg/85 light:bg-light-bg/85 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 mx-auto max-w-7xl md:px-6">
        
        {/* Left Side: Brand Name & Menu toggle */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg md:hidden dark:text-dark-text light:text-light-text hover:bg-slate-500/10"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-2">
            <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-brand to-rose-400">
              CINEVERSE
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 hidden sm:inline-block">
              PRO
            </span>
          </Link>
        </div>

        {/* Middle: Search Box */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md mx-4 hidden md:block">
          <input
            type="text"
            placeholder="Search movies, genres, cast..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-1.5 pl-10 pr-4 text-sm transition-all rounded-full border dark:bg-dark-surface light:bg-light-surface dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
          />
          <Search className="absolute w-4 h-4 text-gray-400 left-3.5 top-2.5" />
        </form>

        {/* Right Side: Quick Options */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 transition-colors rounded-full dark:text-dark-text light:text-light-text hover:bg-slate-500/10"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 transition-colors rounded-full dark:text-dark-text light:text-light-text hover:bg-slate-500/10"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute w-2.5 h-2.5 bg-brand rounded-full top-1.5 right-1.5 ring-2 dark:ring-dark-bg light:ring-light-bg" />
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 w-80 mt-3 border rounded-xl shadow-premium glass-panel dark:border-dark-border light:border-light-border p-4 text-sm animate-in fade-in slide-in-from-top-3 duration-200">
                    <h3 className="font-semibold mb-2 dark:text-dark-text light:text-light-text">Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <span className="text-lg">✨</span>
                        <div>
                          <p className="font-medium dark:text-dark-text light:text-light-text">Your movie recommendations are ready!</p>
                          <span className="text-xs text-gray-400">Just now</span>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-lg">🍿</span>
                        <div>
                          <p className="font-medium dark:text-dark-text light:text-light-text">"Avengers: Endgame" is trending today.</p>
                          <span className="text-xs text-gray-400">2 hours ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand/10 border border-brand/30 text-base">
                    {user?.avatar || '🍿'}
                  </div>
                  <span className="hidden text-sm font-semibold md:block dark:text-dark-text light:text-light-text">
                    {user?.name?.split(' ')[0]}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 w-48 mt-3 border rounded-xl shadow-premium glass-panel dark:border-dark-border light:border-light-border overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="px-4 py-2 border-b dark:border-dark-border light:border-light-border">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-sm font-bold truncate dark:text-dark-text light:text-light-text">{user?.email}</p>
                    </div>
                    
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm transition-colors dark:text-dark-text light:text-light-text hover:bg-slate-500/10"
                    >
                      <UserIcon className="w-4 h-4 mr-3 text-gray-400" />
                      My Profile
                    </Link>
                    <Link
                      to="/watchlist"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm transition-colors dark:text-dark-text light:text-light-text hover:bg-slate-500/10"
                    >
                      <Bookmark className="w-4 h-4 mr-3 text-gray-400" />
                      My Watchlist
                    </Link>
                    <Link
                      to="/ratings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm transition-colors dark:text-dark-text light:text-light-text hover:bg-slate-500/10"
                    >
                      <Star className="w-4 h-4 mr-3 text-gray-400" />
                      My Ratings
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-left transition-colors border-t dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text hover:bg-red-500/10 hover:text-red-500"
                    >
                      <LogOut className="w-4 h-4 mr-3 text-red-400" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-sm font-medium transition-colors hover:text-brand dark:text-dark-text light:text-light-text"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 text-sm font-bold transition-all rounded-full bg-brand text-white hover:bg-brand-hover shadow-glow"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
