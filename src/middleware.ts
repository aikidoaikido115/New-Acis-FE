import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route permissions
const ROLE_ROUTES: Record<string, string[]> = {
  nurse: ['/dashboard', '/elder-info', '/activity'],
  kitchen: ['/manage-meal'],
  relative: ['/relative'],
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register', 
  '/forgot-password',
  '/',
];

// Check if route is public
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

// Get allowed routes for a role
function getAllowedRoutes(role: string): string[] {
  const normalizedRole = role.toLowerCase();
  return ROLE_ROUTES[normalizedRole] || [];
}

// Check if user has access to route
function hasAccess(pathname: string, role: string): boolean {
  const allowedRoutes = getAllowedRoutes(role);
  return allowedRoutes.some(route => pathname.startsWith(route));
}

// Get default route for role
function getDefaultRoute(role: string): string {
  const normalizedRole = role.toLowerCase();
  const routes: Record<string, string> = {
    nurse: '/dashboard',
    kitchen: '/manage-meal',
    relative: '/relative/dashboard',
  };
  return routes[normalizedRole] || '/login';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Get auth token from cookie
  const token = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // No token - redirect to login
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // No role cookie - redirect to login (incomplete auth state)
  if (!userRole) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Check if user has access to this route
  const allowed = hasAccess(pathname, userRole);

  if (!allowed) {
    const defaultRoute = getDefaultRoute(userRole);
    const url = request.nextUrl.clone();
    url.pathname = defaultRoute;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
