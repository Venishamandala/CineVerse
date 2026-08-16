import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MobileBottomNav from '../components/MobileBottomNav';

const Layout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If session check is loading, show blank screen/loading bar
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-dark-bg light:bg-light-bg">
        <div className="flex flex-col items-center space-y-4">
          <span className="text-4xl animate-bounce">🎬</span>
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold tracking-wide text-gray-400">Restoring CineVerse session...</p>
        </div>
      </div>
    );
  }

  // Redirect to Landing Page if unauthenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen transition-colors duration-300 dark:bg-dark-bg light:bg-light-bg dark:text-dark-text light:text-light-text">
      <Navbar onToggleSidebar={toggleSidebar} />
      
      <div className="flex">
        {/* Persistent Desktop Sidebar / Drawer Mobile Sidebar */}
        <Sidebar isOpen={sidebarOpen} />
        
        {/* Main Content Pane */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] p-4 md:p-6 transition-all duration-300 md:ml-60 pb-20 md:pb-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Nav on Mobile Devices */}
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
