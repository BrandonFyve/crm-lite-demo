import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { HubSpotOwnerSummary } from "../types";

async function fetchOwners(): Promise<HubSpotOwnerSummary[]> {
  const response = await fetch(`/api/owners`);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to load owners");
  }
  return response.json();
}

export function useOwnersCombobox() {
  const [owners, setOwners] = useState<HubSpotOwnerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    fetchOwners()
      .then(setOwners)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to load owners";
        setError(message);
        toast.error(message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { owners, isLoading, error, setOwners } as const;
}

