import React from 'react';
import { requireAuth } from '@/lib/authorization';
import { redirect } from 'next/navigation';
import ClientDashboardLayout from './ClientDashboardLayout';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    // Phase 9: Authoritative page protection against the DB
    // This executes on every request to /dashboard or its sub-pages
    // requireAuth internally checks if the user is active in the database.
    await requireAuth();
  } catch (error) {
    // If the DB check fails, redirect to login
    redirect('/login');
  }

  return <ClientDashboardLayout>{children}</ClientDashboardLayout>;
}
