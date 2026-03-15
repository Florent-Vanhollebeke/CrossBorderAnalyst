import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware({
  locales: ['fr', 'en', 'de'],
  defaultLocale: 'fr',
});

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );
  // HSTS uniquement en production (HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  return response;
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';

export default async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  const { response: sessionResponse, user } = await updateSession(request, response);

  const isAdminRoute = /\/(fr|en|de)\/admin(\/|$)/.test(request.nextUrl.pathname);
  if (isAdminRoute) {
    if (!user) {
      const loginUrl = new URL(`/${request.nextUrl.locale ?? 'fr'}/auth/login`, request.url);
      loginUrl.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL(`/${request.nextUrl.locale ?? 'fr'}`, request.url));
    }
  }

  return applySecurityHeaders(sessionResponse);
}

export const config = {
  matcher: ['/', '/(fr|en|de)/:path*'],
};
