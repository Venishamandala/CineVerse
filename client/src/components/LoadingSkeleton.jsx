import React from 'react';

export const MovieCardSkeleton = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden border rounded-2xl dark:bg-dark-surface/40 light:bg-slate-200 dark:border-dark-border light:border-slate-300 animate-pulse">
      {/* Aspect Ratio Poster box */}
      <div className="aspect-[2/3] dark:bg-slate-800 light:bg-slate-300 w-full"></div>
      
      {/* Metadata Labels block */}
      <div className="p-3.5 space-y-2.5">
        <div className="h-4 dark:bg-slate-800 light:bg-slate-300 rounded w-3/4"></div>
        <div className="flex justify-between">
          <div className="h-3 dark:bg-slate-800 light:bg-slate-300 rounded w-1/3"></div>
          <div className="h-3 dark:bg-slate-800 light:bg-slate-300 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
};

export const MovieGridSkeleton = ({ count = 8 }) => {
  const skeletons = Array.from({ length: count });
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {skeletons.map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const MovieDetailsSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse p-4">
      {/* Backdrop panel */}
      <div className="h-64 sm:h-96 w-full dark:bg-slate-800 light:bg-slate-200 rounded-3xl"></div>
      
      {/* Title & metadata panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="aspect-[2/3] dark:bg-slate-800 light:bg-slate-200 rounded-2xl hidden md:block"></div>
        <div className="md:col-span-2 space-y-4">
          <div className="h-10 dark:bg-slate-800 light:bg-slate-200 rounded w-1/2"></div>
          <div className="h-4 dark:bg-slate-800 light:bg-slate-200 rounded w-1/4"></div>
          <div className="h-24 dark:bg-slate-800 light:bg-slate-200 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse p-4">
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 rounded-full dark:bg-slate-800 light:bg-slate-200"></div>
        <div className="space-y-2">
          <div className="h-6 dark:bg-slate-800 light:bg-slate-200 rounded w-48"></div>
          <div className="h-4 dark:bg-slate-800 light:bg-slate-200 rounded w-32"></div>
        </div>
      </div>
      <div className="h-40 dark:bg-slate-800 light:bg-slate-200 rounded-2xl w-full"></div>
    </div>
  );
};
