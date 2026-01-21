import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth-edge';
export async function middleware(request) {
    const cookie = request.cookies.get('session')?.value;
    let session = null;
    try {
        if (cookie) {
            session = await decrypt(cookie);
        }
    } catch (err) {
        // Invalid token (signature mismatch, expired, etc.)
        // We log a simple Clean warning instead of a stack trace to avoid spamming the console
        // console.warn('Middleware: Invalid session token, redirecting to login.');

        // Return a response that clears the cookie and redirects to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session');
        return response;
    }

    // 1. Redirect to /login if not authenticated and trying to access protected route
    if (!session && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/signup')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. Redirect to / if authenticated and trying to access /login or /signup
    if (session && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
