// This route is intentionally left without implementation for the demo branch,
// since the underlying custom deal property `lead_originator_new` is not
// available in a generic HubSpot portal.

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
