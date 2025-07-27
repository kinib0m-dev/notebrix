"use client";

import { ReactNode } from "react";

interface NotebookLayoutProps {
  children: ReactNode;
}

export function NotebookLayout({ children }: NotebookLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Notebook binding rings */}
      <div className="fixed left-16 top-0 bottom-0 w-8 flex flex-col justify-start pt-20 space-y-12 z-10">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 shadow-lg relative"
          >
            <div className="absolute inset-1 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800"></div>
          </div>
        ))}
      </div>

      {/* Main notebook pages container */}
      <div className="relative">
        {/* Page shadows for depth */}
        <div className="absolute inset-0 ml-24 mr-4">
          <div className="h-full bg-white/20 dark:bg-slate-800/20 rounded-r-3xl shadow-2xl transform translate-x-4 translate-y-4"></div>
          <div className="absolute inset-0 h-full bg-white/30 dark:bg-slate-800/30 rounded-r-3xl shadow-xl transform translate-x-2 translate-y-2"></div>
        </div>

        {/* Main content page */}
        <div className="relative ml-24 mr-4 min-h-screen">
          <div className="glass-page rounded-r-3xl shadow-2xl p-8 relative overflow-hidden">
            {/* Page texture overlay */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
              <div 
                className="w-full h-full"
                style={{
                  backgroundImage: `
                    linear-gradient(90deg, transparent 0%, transparent 2%, rgba(0,0,0,0.1) 2%, rgba(0,0,0,0.1) 2.5%, transparent 2.5%),
                    linear-gradient(0deg, transparent 0%, transparent 97%, rgba(0,0,0,0.1) 97%, rgba(0,0,0,0.1) 100%)
                  `,
                  backgroundSize: '40px 40px'
                }}
              ></div>
            </div>

            {/* Red margin line */}
            <div className="absolute left-16 top-0 bottom-0 w-px bg-red-300 dark:bg-red-700 opacity-40"></div>

            {/* Blue ruling lines */}
            <div 
              className="absolute inset-0 opacity-10 dark:opacity-20"
              style={{
                backgroundImage: 'linear-gradient(0deg, transparent 0%, transparent calc(100% - 1px), rgba(59, 130, 246, 0.3) calc(100% - 1px))',
                backgroundSize: '100% 2rem'
              }}
            ></div>

            {/* Content */}
            <div className="relative z-10 ml-20">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}