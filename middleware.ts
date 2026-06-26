import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PROTECTED_PREFIXES: Record<string, string> = {
  '/dashboard/client': 'client',
  '/dashboard/pharmacist': 'pharmacist',
  '/dashboard/admin': 'admin',
};

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const matchedPrefix = Object.keys(PROTECTED_PREFIXES).find((p) => path.startsWith(p));

  if (matchedPrefix) {
    if (!user) {
      const redirectUrl = new URL('/signin', request.url);
      redirectUrl.searchParams.set('next', path);
      return NextResponse.redirect(redirectUrl);
    }
    // Role check happens again server-side in the dashboard layout (defense in depth);
    // here we just gate on "logged in" to avoid an extra DB round trip per request.
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)',
  ],
};
