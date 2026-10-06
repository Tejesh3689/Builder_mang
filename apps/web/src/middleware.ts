import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // AUTH-10: Differentiate Unauthorized API requests from Unauthorized Page navigation
    if (!token) {
      if (path.startsWith('/api/')) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401, 
          headers: { 'content-type': 'application/json' } 
        });
      } else {
        return NextResponse.redirect(new URL('/api/auth/signin?callbackUrl=' + encodeURIComponent(path), req.url));
      }
    }

    // Protect admin routes from non-ADMINs
    if (token?.role !== 'ADMIN') {
      const isProjectManager = token?.role === 'MANAGER';
      const isSiteEngineer = token?.role === 'SUPERVISOR';
      const isStoreManager = token?.role === 'STORE_MANAGER';
      
      const adminOnlyPrefixes = [
        '/admin',
        ...(isProjectManager ? [] : ['/ventures']), // Allow MANAGER to access ventures
        ...(isProjectManager || isStoreManager ? [] : ['/materials']), // Allow MANAGER and STORE_MANAGER to access materials
        '/compliance',
        '/workforce',
        '/onboarding',
      ];
      
      if (adminOnlyPrefixes.some(prefix => path.startsWith(prefix))) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // Special handling for /employees logic (allow /employees/team and /employees/[id])
      if (path === '/employees' || path.startsWith('/employees/managers') || path.startsWith('/employees/supervisors') || path.startsWith('/employees/dashboard')) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // Special handling for /reports logic (allow /reports/team)
      if (path === '/reports' || path.startsWith('/reports/employees') || path.startsWith('/reports/projects') || path.startsWith('/reports/inventory')) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      
      // Global API Blocking - REMOVED
      // Middleware should not block API endpoints; let the API endpoints enforce RBAC and Row-Level Scoping.
      // (P0-4 Remediation)
      const adminApiPrefixes = [
        '/api/auth/register' // keep auth/register admin-only here for basic guard, though API also guards
      ];
      if (adminApiPrefixes.some(prefix => path.startsWith(prefix))) {
         return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'content-type': 'application/json' } });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // Let the middleware body handle all auth branching
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/ventures/:path*',
    '/materials/:path*',
    '/employees/:path*',
    '/chat/:path*',
    '/admin/:path*',
    '/api/:path*'
  ],
};
