import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageSkeletonProps {
  pageTitle?: string;
  variant?: 'dashboard' | 'table' | 'pos' | 'form' | 'default';
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({
  pageTitle = 'Loading...',
  variant = 'default'
}) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn font-sans">
      {/* Top Header Loading Bar */}
      <div className="w-full bg-blue-100/60 h-1 rounded-full overflow-hidden relative">
        <div className="absolute inset-0 bg-blue-600 rounded-full animate-pulse w-2/3"></div>
      </div>

      {/* Header & Action Buttons Shimmer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              {pageTitle}
            </span>
          </div>
          <div className="h-7 w-48 sm:w-64 bg-slate-200 rounded-lg animate-pulse"></div>
          <div className="h-4 w-32 sm:w-40 bg-slate-100 rounded-md animate-pulse"></div>
        </div>

        {/* Action Button Skeletons */}
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-slate-200 rounded-xl animate-pulse"></div>
          <div className="h-9 w-32 bg-blue-200/70 rounded-xl animate-pulse"></div>
        </div>
      </div>

      {/* Conditional Layout Skeletons */}
      {variant === 'pos' ? (
        /* POS Specific Skeleton */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-11 bg-slate-200 rounded-xl animate-pulse"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl p-3 space-y-2 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-5 bg-blue-100 rounded w-2/3 mt-4"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-50 border border-slate-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
            <div className="h-14 bg-blue-600/30 rounded-xl animate-pulse mt-8"></div>
          </div>
        </div>
      ) : variant === 'dashboard' ? (
        /* Dashboard Specific Skeleton with Metric Cards & Charts */
        <div className="space-y-6">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 animate-pulse"></div>
                </div>
                <div className="h-7 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-slate-100 rounded w-1/3 animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Chart & Activity Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-slate-200 rounded w-1/3 animate-pulse"></div>
                <div className="h-7 bg-slate-100 rounded w-24 animate-pulse"></div>
              </div>
              <div className="h-64 bg-slate-50 rounded-xl flex items-end justify-between p-4 gap-2">
                {[40, 70, 55, 90, 65, 85, 95].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-full bg-blue-100 rounded-t-md animate-pulse"
                  ></div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="h-5 bg-slate-200 rounded w-1/2 animate-pulse"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="h-3.5 bg-slate-200 rounded w-24 animate-pulse"></div>
                      <div className="h-2.5 bg-slate-100 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-slate-200 rounded w-12 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Table / List / Form General Skeleton */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50/50">
            <div className="h-9 bg-white border border-slate-200 rounded-xl w-full sm:w-72 animate-pulse"></div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="h-9 w-24 bg-white border border-slate-200 rounded-xl animate-pulse"></div>
              <div className="h-9 w-24 bg-white border border-slate-200 rounded-xl animate-pulse"></div>
            </div>
          </div>

          {/* Table Rows Shimmer */}
          <div className="divide-y divide-slate-100">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0 animate-pulse"></div>
                  <div className="space-y-1.5 flex-1 max-w-sm">
                    <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-4 bg-slate-100 rounded w-20 hidden md:block animate-pulse"></div>
                <div className="h-5 bg-slate-200 rounded w-16 animate-pulse"></div>
                <div className="w-8 h-8 bg-slate-100 rounded-lg shrink-0 animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Footer pagination */}
          <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div className="h-4 bg-slate-200 rounded w-32 animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-white border border-slate-200 rounded-lg animate-pulse"></div>
              <div className="h-8 w-16 bg-white border border-slate-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
