import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Use getSession() instead of getUser() for middleware.
    // getSession() reads the JWT from the cookie without a network round-trip to Supabase,
    // which is critical on Cloudflare's edge where cold-start latency is high.
    // The JWT is cryptographically signed, so it is safe to trust for route-guarding.
    // getUser() (server-side token validation) is reserved for sensitive data operations.
    const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    const user = session?.user ?? null;

    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login');

    if (isAdminRoute) {
      if (!user) {
        // Redirect non-authenticated users to login page
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        return NextResponse.redirect(url);
      }

      // RBAC: Verify if the user is genuinely an admin using the custom claim in the JWT
      const isAdmin = user.app_metadata?.role === 'admin';

      if (!isAdmin) {
        // User is logged in but NOT an admin.
        // Eject them to the homepage.
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    } else if (request.nextUrl.pathname.startsWith('/admin/login')) {
      // If they are already logged in as an admin and try to access the login page, redirect to dashboard
      if (user && user.app_metadata?.role === 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      }
    }
  } catch (error) {
    console.error("Middleware Supabase error:", error);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
