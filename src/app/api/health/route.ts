import { NextResponse } from "next/server";

/**
 * Health check endpoint for Playwright E2E tests
 * This endpoint is public (no authentication required)
 */
export async function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}

