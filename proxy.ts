import withAuth, { type NextRequestWithAuth } from "next-auth/middleware";
import type { NextFetchEvent, NextRequest } from "next/server";

// Keep the existing NextAuth JWT gate; Next requires a local function export here.
export function proxy(request: NextRequest, event: NextFetchEvent) {
  return withAuth(request as NextRequestWithAuth, event);
}

export const config = {
  matcher: ["/movies/new", "/movies/edit/:id+"],
};
