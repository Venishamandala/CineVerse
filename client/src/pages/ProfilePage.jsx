import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ProfileSkeleton } from '../components/LoadingSkeleton';
import { User, Calendar, Mail, Star, Bookmark, Film, BarChart3, PieChart as PieIcon, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';

const ProfilePage = () => {
  const { user } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Genre map resolver
  const genreMap = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
  };

  const fetchProfileAndAnalytics = async () => {
    setLoading(true);
    try {
      const [profileRes, analyticsRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/users/analytics')
      ]);

      if (profileRes.data.success) {
        setProfileData(profileRes.data.data);
      }
      if (analyticsRes.data.success) {
        setAnalyticsData(analyticsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load profile and analytics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndAnalytics();
  }, []);

  if (loading || !profileData) {
    return <ProfileSkeleton />;
  }

  // Color constants for charts cell formatting
  const COLORS = ['#E11D48', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  const stats = profileData.stats || { moviesRated: 0, watchlistCount: 0, moviesWatched: 0 };
  const ratingDist = analyticsData?.ratingDistribution || [];
  const genreData = analyticsData?.favoriteGenres || [];
  const languageData = analyticsData?.preferredLanguages || [];
  const activityData = analyticsData?.activityData || [];

  return (
    <div className="space-y-8">
      
      {/* 1. Large Profile Hero Header card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border dark:border-dark-border light:border-light-border dark:bg-dark-surface/40 light:bg-white p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-premium"
      >
        <div className="absolute top-0 right-0 w-44 h-44 bg-brand/10 rounded-full filter blur-3xl" />
        
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-brand/10 border-2 border-brand text-4xl flex items-center justify-center shadow-lg select-none">
          {profileData.avatar || '🍿'}
        </div>

        {/* User Info panel */}
        <div className="flex-1 space-y-2.5 text-center md:text-left">
          <h2 className="text-2xl font-black tracking-tight dark:text-dark-text light:text-light-text flex items-center justify-center md:justify-start gap-2">
            {profileData.name} <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-brand/10 text-brand">Viewer</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 text-xs text-gray-400">
            <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1 text-brand" /> {profileData.email}</span>
            <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1 text-brand" /> Member since {new Date(profileData.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
          </div>
        </div>

        {/* Short counts banner */}
        <div className="flex space-x-6 text-center pt-4 md:pt-0 border-t md:border-t-0 md:border-l dark:border-dark-border light:border-light-border md:pl-8">
          <div>
            <p className="text-xl font-black text-brand">{stats.moviesWatched}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Watched</p>
          </div>
          <div>
            <p className="text-xl font-black text-brand">{stats.moviesRated}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rated</p>
          </div>
          <div>
            <p className="text-xl font-black text-brand">{stats.watchlistCount}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Watchlist</p>
          </div>
        </div>
      </motion.div>

      {/* 2. Preferences display block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Favorite genres tag list */}
        <div className="p-5 border rounded-2xl dark:bg-dark-surface/40 light:bg-white dark:border-dark-border light:border-light-border shadow-sm">
          <h3 className="font-bold text-sm mb-3.5 flex items-center gap-1.5 dark:text-dark-text light:text-light-text">
            <Sparkles className="w-4 h-4 text-brand" /> Favorite Genres
          </h3>
          <div className="flex flex-wrap gap-2">
            {profileData.favoriteGenres?.length > 0 ? (
              profileData.favoriteGenres.map(gid => (
                <span key={gid} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand/10 text-brand border border-brand/20">
                  {genreMap[gid] || 'Genre'}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">No favorite genres selected. Configure in onboarding.</span>
            )}
          </div>
        </div>

        {/* Favorite languages tag list */}
        <div className="p-5 border rounded-2xl dark:bg-dark-surface/40 light:bg-white dark:border-dark-border light:border-light-border shadow-sm">
          <h3 className="font-bold text-sm mb-3.5 flex items-center gap-1.5 dark:text-dark-text light:text-light-text">
            <Sparkles className="w-4 h-4 text-brand" /> Preferred Languages
          </h3>
          <div className="flex flex-wrap gap-2">
            {profileData.preferredLanguages?.length > 0 ? (
              profileData.preferredLanguages.map(langCode => (
                <span key={langCode} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider dark:bg-dark-surface dark:border-dark-border light:bg-slate-200 border border-transparent dark:text-dark-text light:text-light-text">
                  {langCode.toUpperCase()}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">No language code selected. Configure in onboarding.</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Visual Charts Grid using Recharts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart A: Rating Distribution */}
        <div className="p-5 border rounded-2xl dark:bg-dark-surface/40 light:bg-white dark:border-dark-border light:border-light-border shadow-sm">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5 dark:text-dark-text light:text-light-text">
            <BarChart3 className="w-4 h-4 text-brand" /> Star Rating Distribution
          </h3>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingDist} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#888888" tickLine={false} />
                <YAxis stroke="#888888" tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(21, 29, 48, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="count" fill="#E11D48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Favorite Languages pie chart */}
        <div className="p-5 border rounded-2xl dark:bg-dark-surface/40 light:bg-white dark:border-dark-border light:border-light-border shadow-sm">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5 dark:text-dark-text light:text-light-text">
            <PieIcon className="w-4 h-4 text-brand" /> Preferred Language Share
          </h3>
          <div className="h-60 w-full text-xs flex items-center justify-center">
            {languageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {languageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(21, 29, 48, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-xs">No language data logged.</p>
            )}
          </div>
        </div>

        {/* Chart C: User activity logs over time */}
        <div className="md:col-span-2 p-5 border rounded-2xl dark:bg-dark-surface/40 light:bg-white dark:border-dark-border light:border-light-border shadow-sm">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5 dark:text-dark-text light:text-light-text">
            <TrendingUp className="w-4 h-4 text-brand" /> Activity Logs (Interactions Over Time)
          </h3>
          <div className="h-64 w-full text-xs">
            {activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E11D48" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#E11D48" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222F4D" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#888888" tickLine={false} />
                  <YAxis stroke="#888888" tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(21, 29, 48, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Area type="monotone" dataKey="interactions" stroke="#E11D48" strokeWidth={2} fillOpacity={1} fill="url(#colorActivity)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-450 text-xs">No interaction activity logs available yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default ProfilePage;
