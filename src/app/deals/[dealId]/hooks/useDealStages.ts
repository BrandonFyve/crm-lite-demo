import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { DealStage } from "@/lib/hubspot-deals";

async function fetchDealStages(): Promise<DealStage[]> {
  const response = await fetch(`/api/deals/stages`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch deal stages");
  }
  return response.json();
}

export function useDealStages() {
  const [stages, setStages] = useState<DealStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    fetchDealStages()
      .then((data) => setStages(data))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to load deal stages";
        setError(message);
        toast.error("Failed to load deal stages");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { stages, isLoading, error } as const;
}

