import { useEffect, useState } from "react";
import type { OwnerSummary } from "@/lib/hubspot-owners";
import { fetchOwners } from "@/services/owners";

export function useOwners() {
  const [owners, setOwners] = useState<OwnerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadOwners() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchOwners();
        if (mounted) {
          setOwners(data);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load owners");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadOwners();

    return () => {
      mounted = false;
    };
  }, []);

  return { owners, isLoading, error };
}

