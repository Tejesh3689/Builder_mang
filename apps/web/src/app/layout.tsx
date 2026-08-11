import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Builder Management Portal',
  description: 'Production-grade enterprise portal for materials, employees, and venture-wise chat.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-50">
        {children}
      </body>
    </html>
  );
}
