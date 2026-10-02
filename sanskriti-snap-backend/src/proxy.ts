import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Next 16 renamed Middleware to Proxy. This file is the Clerk entry point that
 * makes `auth()` available in route handlers.
 *
 * Authorization is NOT done here. Proxy is for optimistic checks only; every
 * protected route re-verifies identity and role in its handler, because
 * anything in Proxy can be bypassed by a direct request to the route
 * (docs/Backend TDS.md 10).
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    /**
     * Everything except static assets and image optimization output. The API
     * routes are included because `auth()` needs the Clerk context there.
     */
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
