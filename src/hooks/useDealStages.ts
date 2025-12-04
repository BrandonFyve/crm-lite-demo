import { useEffect, useState } from "react";
import type { DealStage } from "@/lib/hubspot-deals";
import { fetchDealStages } from "@/services/deals";

export function useDealStages() {
  const [stages, setStages] = useState<DealStage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadStages() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchDealStages();
        if (mounted) {
          setStages(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load stages");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadStages();

    return () => {
      mounted = false;
    };
  }, []);

  return { stages, isLoading, error };
}

