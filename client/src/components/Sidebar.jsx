import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Sparkles, Languages, Ghost, Star, Bookmark, User, LogOut, BrainCircuit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen }) => {
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Discover', path: '/discover', icon: Compass },
    { name: 'For You', path: '/for-you', icon: Sparkles },
    { name: 'AI Suggester', path: '/ai-suggester', icon: BrainCircuit },
    { name: 'Languages', path: '/languages', icon: Languages },
    { name: 'Genres', path: '/genres', icon: Ghost }, // Ghost / Mask / Clowns is cool for genres
    { name: 'My Ratings', path: '/ratings', icon: Star },
    { name: 'My Watchlist', path: '/watchlist', icon: Bookmark },
    { name: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <aside
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] z-30 transition-all duration-300 border-r w-64 glass-panel dark:border-dark-border light:border-light-border dark:bg-dark-bg/95 light:bg-light-bg/95 
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-60'}
      `}
    >
      <div className="flex flex-col justify-between h-full py-6 px-4">
        
        {/* Navigation Routes */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group
                ${isActive
                  ? 'bg-brand text-white shadow-glow'
                  : 'dark:text-gray-400 light:text-gray-600 dark:hover:text-dark-text light:hover:text-light-text hover:bg-slate-500/10'
                }
              `}
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Quick Footer LogOut button */}
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 dark:text-red-400 light:text-red-500 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Sign Out</span>
        </button>
        
      </div>
    </aside>
  );
};

export default Sidebar;
