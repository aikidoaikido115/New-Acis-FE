import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route permissions
const NURSE_ROUTES = [
  '/dashboard',
  '/elder-info',
  '/activity',
  '/emr',
  '/medicine',
  '/warehouse',
  '/user-manual',
  '/support-service',
  '/support-tickets',
  '/profile',
  '/notification',
  '/change-password',
  '/terms',
  '/privacy',
];

const KITCHEN_ROUTES = [
  '/manage-meal',
  '/user-manual-kitchen',
  '/support-service-kitchen',
  '/support-tickets',
  '/profile',
  '/notification',
  '/change-password',
  '/terms',
  '/privacy',
];

const SUPERUSER_ROUTES = Array.from(new Set([
  ...NURSE_ROUTES,
  ...KITCHEN_ROUTES,
]));

const ADMIN_ROUTES = Array.from(new Set([
  '/admin',
  ...NURSE_ROUTES,
  ...KITCHEN_ROUTES,
]));

const ROLE_ROUTES: Record<string, string[]> = {
  nurse: NURSE_ROUTES,
  superuser: SUPERUSER_ROUTES,
  kitchen: KITCHEN_ROUTES,
  admin: ADMIN_ROUTES,
  relative: ['/relative', '/change-password' , '/relative/dashboard' ,'/relative/patient-info' , '/relative/privacy' , '/relative/terms'],
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register', 
  '/consent',
  '/forgot-password',
  '/relative/login',
  '/relative/consent',
];

// Check if route is public
function isPublicRoute(pathname: string): boolean {
  // Exact match for home page
  if (pathname === '/') {
    return true;
  }
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

// Get allowed routes for a role
function getAllowedRoutes(role: string): string[] {
  const normalizedRole = role.toLowerCase().trim();
  const roleKey = normalizedRole === 'super user' || normalizedRole === 'super_user' ? 'superuser' : normalizedRole;
  return ROLE_ROUTES[roleKey] || [];
}

// Check if user has access to route
function hasAccess(pathname: string, role: string): boolean {
  const allowedRoutes = getAllowedRoutes(role);
  return allowedRoutes.some(route => pathname.startsWith(route));
}

// Get default route for role
function getDefaultRoute(role: string): string {
  const normalizedRole = role.toLowerCase().trim();
  const roleKey = normalizedRole === 'super user' || normalizedRole === 'super_user' ? 'superuser' : normalizedRole;
  const routes: Record<string, string> = {
    nurse: '/dashboard',
    superuser: '/dashboard',
    kitchen: '/manage-meal',
    admin: '/admin/users',
    relative: '/relative/dashboard',
  };
  return routes[roleKey] || '/login';
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Get auth token from cookie
  const token = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // No token - redirect to appropriate login
  if (!token) {
    const url = request.nextUrl.clone();
    // Check if this is a relative route
    if (pathname.startsWith('/relative')) {
      url.pathname = '/relative/login';
    } else {
      url.pathname = '/login';
    }
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // No role cookie - redirect to appropriate login (incomplete auth state)
  if (!userRole) {
    const url = request.nextUrl.clone();
    // Check if this is a relative route
    if (pathname.startsWith('/relative')) {
      url.pathname = '/relative/login';
    } else {
      url.pathname = '/login';
    }
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

// Configure which routes to run proxy on
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