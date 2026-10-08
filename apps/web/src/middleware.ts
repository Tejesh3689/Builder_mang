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

    // Protect admin routes from non-ADMINs - MOVED to layout.tsx (P0-1 Remediation)
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
    '/api/:path*',
    '/compliance/:path*',
    '/workforce/:path*',
    '/onboarding/:path*'
  ],
};
