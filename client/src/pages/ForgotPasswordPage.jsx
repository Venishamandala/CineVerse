import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Film, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending recovery email
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1200);
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
          <h2 className="text-2xl font-black tracking-tight dark:text-dark-text light:text-light-text text-center">
            Recover Password
          </h2>
          <p className="text-xs text-gray-400 mt-1 text-center">
            Enter your email to receive recovery instructions
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="p-3 text-sm font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              📬 Recovery instructions have been sent to <strong>{email}</strong> if an account exists.
            </div>
            <Link
              to="/login"
              className="inline-flex items-center text-xs font-semibold text-brand hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 text-sm font-bold text-white transition-all rounded-xl bg-brand hover:bg-brand-hover shadow-glow disabled:opacity-50"
            >
              {loading ? 'Sending Recovery...' : 'Send Recovery Email'}
            </button>
            
            <div className="text-center mt-4">
              <Link to="/login" className="inline-flex items-center text-xs text-gray-400 hover:text-brand hover:underline">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
