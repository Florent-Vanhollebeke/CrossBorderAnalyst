import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
});

export default async function middleware(request: NextRequest) {
  // First, we get a response from next-intl (i18n routing layer)
  const response = intlMiddleware(request);

  // Then, we pass that response and the request into Supabase's updateSession
  // to ensure cookies are refreshed correctly across internationalized routes.
  return await updateSession(request, response);
}

export const config = {
  matcher: ['/', '/(fr|en)/:path*'],
};
