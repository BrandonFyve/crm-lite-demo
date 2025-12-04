import { NextResponse } from "next/server";
import { getDealStages } from "@/lib/hubspot-deals";

export async function GET() {
  try {
    const stages = await getDealStages();
    return NextResponse.json(stages);
  } catch (error) {
    console.error("Error loading deal stages:", error);
    return NextResponse.json(
      { error: "Unable to load deal stages" },
      { status: 500 },
    );
  }
}
