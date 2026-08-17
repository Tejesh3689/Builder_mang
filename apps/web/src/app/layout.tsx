import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Builder Management Portal',
  description: 'Production-grade enterprise portal for materials, employees, and venture-wise chat.',
};

import { NextAuthProvider } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#EAEAEA] text-black antialiased">
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}
