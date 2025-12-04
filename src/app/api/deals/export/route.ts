import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { startDealExport, pollExportUntilComplete } from "@/lib/hubspot-deals";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
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

    // Start the export
    const { id } = await startDealExport();

    // Poll until complete
    const downloadUrl = await pollExportUntilComplete(id);

    return NextResponse.json({ downloadUrl });
  } catch (error: unknown) {
    console.error("Error exporting deals:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to export deals";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

