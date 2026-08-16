import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Film } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setFormLoading(true);

    try {
      const res = await login(email, password);
      if (res && res.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Incorrect email or password.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] dark:bg-dark-bg light:bg-light-bg px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 border rounded-3xl shadow-premium glass-panel dark:border-dark-border light:border-light-border dark:bg-dark-surface/60 light:bg-white"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 mb-3 rounded-2xl bg-brand/10 text-brand border border-brand/20">
            <Film className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight dark:text-dark-text light:text-light-text">
            Welcome Back to CineVerse
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Access your custom movie universe and recommendations
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 mb-5 text-sm font-semibold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block mb-2 text-xs font-bold uppercase tracking-wider dark:text-gray-300 light:text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full py-2.5 pl-10 pr-4 text-sm rounded-xl border dark:bg-dark-surface/80 light:bg-light-surface dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
              />
              <Mail className="absolute w-4 text-gray-400 left-3.5 top-3" />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider dark:text-gray-300 light:text-gray-700">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-brand hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-2.5 pl-10 pr-10 text-sm rounded-xl border dark:bg-dark-surface/80 light:bg-light-surface dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
              />
              <Lock className="absolute w-4 text-gray-400 left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute text-gray-400 hover:text-white right-3 top-3 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign In Trigger */}
          <button
            type="submit"
            disabled={formLoading}
            className="w-full py-3 mt-4 text-sm font-bold text-white transition-all rounded-xl bg-brand hover:bg-brand-hover shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs dark:text-gray-400 light:text-gray-600">
          Don't have a CineVerse account?{' '}
          <Link to="/register" className="font-bold text-brand hover:underline">
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
