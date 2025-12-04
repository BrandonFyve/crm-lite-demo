import { NextResponse } from "next/server";
import { getTicketStages } from "@/lib/hubspot-tickets";

// GET handler to fetch all ticket pipelines and their stages
export async function GET() {
  try {
    const stages = await getTicketStages();
    if (!stages.length) {
      return NextResponse.json(
        { message: "No ticket pipelines found." },
        { status: 404 },
      );
    }

    return NextResponse.json(stages);
  } catch (error) {
    console.error("Error fetching ticket stages:", error);
    return NextResponse.json(
      { message: "Failed to fetch ticket stages." },
      { status: 500 },
    );
  }
}
