import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/api/deals/stages",
  "/api/tickets/stages",
  "/api/health",
]);

/**
 * Check if we're running in E2E test mode
 * In test mode, we bypass Clerk authentication to allow E2E tests to run
 */
const isE2ETestMode = process.env.NODE_ENV === 'test' || process.env.E2E_TEST_MODE === 'true';

export default clerkMiddleware(async (auth, req) => {
  // Skip authentication in E2E test mode
  if (isE2ETestMode) {
    return;
  }
  
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
