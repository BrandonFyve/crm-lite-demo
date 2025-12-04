import type { OwnerSummary } from "@/lib/hubspot-owners";

export async function fetchOwners(): Promise<OwnerSummary[]> {
  const response = await fetch("/api/owners");

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.message || "Failed to load owners";
    throw new Error(message);
  }

  return response.json();
}

