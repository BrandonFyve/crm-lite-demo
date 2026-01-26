import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCachedDeals } from "@/lib/hubspot-deals";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await auth();
    const isE2ETestMode = process.env.E2E_TEST_MODE === 'true';
    const userId = authResult?.userId ?? (isE2ETestMode ? 'e2e_test_user' : null);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get pipelineId from query params
    const searchParams = request.nextUrl.searchParams;
    const pipelineId = searchParams.get("pipelineId");

    // Fetch deals with optional pipeline filter
    const deals = await getCachedDeals({
      limit: 100,
      pipelineId: pipelineId || undefined,
    });

    return NextResponse.json(deals);
  } catch (error: unknown) {
    console.error("Error fetching deals:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch deals";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
