import { clerkMiddleware } from '@clerk/nextjs/server';

const protectedRoutes = [
  '/',

];

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`),
  );

  if (isProtectedRoute) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|png|gif|svg|webp|ico|ttf|woff2?)).*)',
    '/(api|trpc)(.*)',
  ],
};