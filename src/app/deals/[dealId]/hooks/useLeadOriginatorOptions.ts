import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ServiceOption } from "../types";

async function fetchLeadOriginatorOptions(): Promise<ServiceOption[]> {
  const response = await fetch(`/api/deals/lead-originator-options`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || "Failed to fetch lead originator options"
    );
  }
  return response.json();
}

export function useLeadOriginatorOptions(initialOption?: string) {
  const [options, setOptions] = useState<ServiceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    fetchLeadOriginatorOptions()
      .then((fetched) => {
        setOptions((prev) => {
          const merged = [...fetched];
          const seen = new Set(merged.map((option) => option.value));
          prev.forEach((option) => {
            if (!seen.has(option.value)) {
              merged.push(option);
              seen.add(option.value);
            }
          });

          if (initialOption && !seen.has(initialOption)) {
            merged.push({ value: initialOption, label: initialOption });
          }

          return merged;
        });
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load lead originator options.";
        setError(message);
        toast.error(message);
        if (initialOption) {
          setOptions((prev) => {
            if (prev.some((option) => option.value === initialOption)) {
              return prev;
            }
            return [...prev, { value: initialOption, label: initialOption }];
          });
        }
      })
      .finally(() => setIsLoading(false));
  }, [initialOption]);

  return { options, isLoading, error, setOptions } as const;
}
