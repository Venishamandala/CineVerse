import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

const TrailerModal = ({
  isOpen,
  onClose,
  youtubeKey = null,
  movieTitle = 'Movie Trailer'
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        
        {/* Clickable Backdrop overlay to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        />

        {/* Modal Sheet Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-4xl border overflow-hidden shadow-2xl rounded-2xl dark:bg-dark-surface dark:border-dark-border light:bg-light-surface light:border-light-border z-10"
        >
          {/* Header Panel */}
          <div className="flex items-center justify-between px-5 py-4 border-b dark:border-dark-border light:border-light-border">
            <h3 className="text-base font-bold dark:text-dark-text light:text-light-text line-clamp-1">
              🎬 {movieTitle} - Official Trailer
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 transition-colors rounded-full text-gray-400 hover:text-white dark:hover:bg-slate-800 light:hover:bg-slate-200"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Iframe Video Space */}
          <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center">
            {youtubeKey ? (
              <iframe
                title={`${movieTitle} trailer`}
                src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&enablejsapi=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-none"
              />
            ) : (
              <div className="flex flex-col items-center p-6 text-center space-y-3">
                <AlertCircle className="w-12 h-12 text-brand animate-pulse" />
                <h4 className="text-lg font-bold text-white">Trailer Unavailable</h4>
                <p className="text-sm text-gray-400 max-w-sm">
                  We couldn't find an official YouTube trailer in TMDB's video directory for this title.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2 mt-2 text-xs font-semibold rounded-full bg-white text-slate-950 hover:bg-slate-200"
                >
                  Close Modal
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TrailerModal;
