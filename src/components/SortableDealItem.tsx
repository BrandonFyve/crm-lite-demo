"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimplePublicObjectWithAssociations } from "@hubspot/api-client/lib/codegen/crm/deals";
import Link from "next/link";

type SortableDealItemProps = {
  deal: SimplePublicObjectWithAssociations;
  isUpdating: boolean;
};

export function SortableDealItem({ deal, isUpdating }: SortableDealItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: deal.id,
      data: {
        type: "deal",
        deal,
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isUpdating ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <Link href={`/deals/${deal.id}`}>
        <Card className="mb-2 py-0 hover:shadow-md">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-base font-medium">
              {deal.properties.dealname || "Unnamed Deal"}
            </CardTitle>
            <p className="text-sm text-gray-500">
              Close Date:{" "}
              {deal.properties.closedate
                ? new Date(deal.properties.closedate).toLocaleDateString()
                : "N/A"}
            </p>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <p className="text-2xl font-semibold">
              {deal.properties.amount
                ? `R${Number(deal.properties.amount).toLocaleString()}`
                : "N/A"}
            </p>
            <div className="mt-2"></div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
