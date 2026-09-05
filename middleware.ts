import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabasePublicEnv } from '@/lib/supabase/env';

const PUBLIC_ADMIN = ['/admin/login', '/admin/recuperar-senha'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  if (PUBLIC_ADMIN.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const env = getSupabasePublicEnv();
  if (!env) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('config', 'missing');
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
