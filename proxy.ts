import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const protectedRoutes = [
  '/',

];

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) => {
    return route === '/'
      ? pathname === '/'
      : pathname === route || pathname.startsWith(`${route}/`);
  });

  if (!isProtectedRoute) {
    return;
  }

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(
      new URL('/signin', req.url),
    );
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};