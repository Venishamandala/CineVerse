import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Sparkles, Bookmark, User } from 'lucide-react';

const MobileBottomNav = () => {
  const items = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Discover', path: '/discover', icon: Compass },
    { name: 'For You', path: '/for-you', icon: Sparkles },
    { name: 'Watchlist', path: '/watchlist', icon: Bookmark },
    { name: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <div className="fixed bottom-0 left-0 z-30 w-full md:hidden border-t glass-panel dark:border-dark-border light:border-light-border dark:bg-dark-bg/95 light:bg-light-bg/95 backdrop-blur-lg">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all duration-200 text-xs font-bold
              ${isActive 
                ? 'text-brand' 
                : 'text-gray-400 dark:hover:text-dark-text light:hover:text-light-text'
              }
            `}
          >
            <item.icon className="w-5 h-5 mb-0.5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default MobileBottomNav;
