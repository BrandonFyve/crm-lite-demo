import type { DealStage } from "@/lib/hubspot-deals";

export async function fetchDealStages(): Promise<DealStage[]> {
  const response = await fetch("/api/deals/stages");

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.message || "Failed to load deal stages";
    throw new Error(message);
  }

  return response.json();
}

