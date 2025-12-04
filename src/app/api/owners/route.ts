import { NextResponse } from "next/server";
import { getOwners } from "@/lib/hubspot-owners";
import { ownersResponseSchema } from "@/validators/owner";
import { ZodError } from "zod";

export async function GET() {
  try {
    const owners = await getOwners();
    const parsed = ownersResponseSchema.parse(owners);
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    // Log detailed error information for debugging
    console.error("Error in /api/owners:", error);

    // Handle Zod validation errors separately
    if (error instanceof ZodError) {
      console.error("Validation errors:", error.errors);
      const message = `Validation failed: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`;
      return NextResponse.json(
        { message, errors: error.errors },
        { status: 500 }
      );
    }

    // Handle other errors
    const message = error instanceof Error ? error.message : "Failed to fetch owners";
    return NextResponse.json({ message }, { status: 500 });
  }
}


