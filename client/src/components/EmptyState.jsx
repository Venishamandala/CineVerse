import React from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({
  icon = '🎬',
  title = 'Nothing here yet',
  description = 'Start exploring and curate your entertainment universe.',
  ctaText = 'Explore Movies',
  onCtaClick = null
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-3xl dark:border-dark-border light:border-light-border bg-slate-500/5 my-6 max-w-lg mx-auto"
    >
      {/* Popcorn / Cinema Sticker Indicator */}
      <span className="text-6xl mb-4 select-none filter drop-shadow-md animate-bounce duration-1000">
        {icon}
      </span>

      <h3 className="text-lg font-bold mb-2 dark:text-dark-text light:text-light-text">
        {title}
      </h3>
      
      <p className="text-sm text-gray-400 mb-6 max-w-sm leading-relaxed">
        {description}
      </p>

      {onCtaClick && (
        <button
          onClick={onCtaClick}
          className="px-6 py-2.5 text-sm font-bold text-white rounded-full bg-brand hover:bg-brand-hover transition-all duration-200 shadow-glow"
        >
          {ctaText}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
