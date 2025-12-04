"use client";

import { Button } from "@/components/ui/button";

interface DealHeaderProps {
  dealId: string;
  dealName: string;
  onBack: () => void;
}

export function DealHeader({ dealId, dealName, onBack }: DealHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-2 -ml-4 text-muted-foreground"
        >
          ← Back to Deals
        </Button>
        <h1 className="text-3xl font-bold">{dealName || "Unnamed Deal"}</h1>
        <p className="text-muted-foreground">ID: {dealId}</p>
      </div>
    </div>
  );
}

