import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DealWithCompanies } from "../types";

async function fetchDealDetails(dealId: string): Promise<DealWithCompanies> {
  const response = await fetch(`/api/deals/${dealId}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch deal details");
  }
  return response.json();
}

export function useDealDetails(dealId: string) {
  const [deal, setDeal] = useState<DealWithCompanies | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!dealId) return;

    setIsLoading(true);
    setError(null);

    fetchDealDetails(dealId)
      .then((data) => {
        setDeal(data);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to load deal.";
        setError(message);
        toast.error("Failed to load deal details");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [dealId]);

  return { deal, setDeal, error, isLoading } as const;
}

