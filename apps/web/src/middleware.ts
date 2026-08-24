import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Protect admin routes from non-ADMINs
    if (token?.role !== 'ADMIN') {
      const isManager = token?.role === 'MANAGER';
      
      const adminOnlyPrefixes = [
        '/admin',
        ...(isManager ? [] : ['/ventures']), // Allow MANAGER to access ventures
        '/materials',
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
      
      // Global API Blocking
      const isSupervisor = token?.role === 'SUPERVISOR';
      const adminApiPrefixes = [
        ...(isManager || isSupervisor ? [] : ['/api/ventures']), // Allow MANAGER and SUPERVISOR to access ventures API for dropdowns
        '/api/materials',
        '/api/workforce',
        '/api/onboarding',
        '/api/assignments',
        '/api/auth/register'
      ];
      if (adminApiPrefixes.some(prefix => path.startsWith(prefix))) {
        // Prevent blocking GET requests if they are safe, but for now block all
        return new NextResponse(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: { 'content-type': 'application/json' } });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
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
