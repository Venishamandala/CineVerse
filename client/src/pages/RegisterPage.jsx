import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Film } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Too Short', color: 'bg-red-500' });

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, label: 'Too Short', color: 'bg-red-500' });
      return;
    }
    if (password.length < 6) {
      setPasswordStrength({ score: 1, label: 'Weak', color: 'bg-red-500' });
      return;
    }

    let score = 2;
    let label = 'Moderate';
    let color = 'bg-yellow-500';

    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);
    const hasUppercase = /[A-Z]/.test(password);

    if (hasNumbers && hasNonalphas && hasUppercase && password.length >= 8) {
      score = 4;
      label = 'Strong & Secure';
      color = 'bg-emerald-500';
    } else if ((hasNumbers || hasNonalphas) && password.length >= 6) {
      score = 3;
      label = 'Good';
      color = 'bg-blue-500';
    }

    setPasswordStrength({ score, label, color });
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setFormLoading(true);

    try {
      const res = await register(name, email, password, confirmPassword);
      if (res && res.success) {
        navigate('/onboarding');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please check your parameters.');
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
            Join CineVerse
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Build your personalized entertainment universe today
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 mb-5 text-sm font-semibold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider dark:text-gray-300 light:text-gray-700">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full py-2.5 pl-10 pr-4 text-sm rounded-xl border dark:bg-dark-surface/80 light:bg-light-surface dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
              />
              <UserIcon className="absolute w-4 text-gray-400 left-3.5 top-3" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider dark:text-gray-300 light:text-gray-700">
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
            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider dark:text-gray-300 light:text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
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

            {/* Password strength visualization */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                  <span>Strength: {passwordStrength.label}</span>
                </div>
                <div className="flex space-x-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} rounded-full transition-all duration-300`}
                    style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider dark:text-gray-300 light:text-gray-700">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full py-2.5 pl-10 pr-4 text-sm rounded-xl border dark:bg-dark-surface/80 light:bg-light-surface dark:border-dark-border light:border-light-border dark:text-dark-text light:text-light-text focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
              />
              <Lock className="absolute w-4 text-gray-400 left-3.5 top-3" />
            </div>
          </div>

          {/* Register Trigger */}
          <button
            type="submit"
            disabled={formLoading}
            className="w-full py-3 mt-4 text-sm font-bold text-white transition-all rounded-xl bg-brand hover:bg-brand-hover shadow-glow disabled:opacity-50"
          >
            {formLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs dark:text-gray-400 light:text-gray-600">
          Already have a CineVerse account?{' '}
          <Link to="/login" className="font-bold text-brand hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
