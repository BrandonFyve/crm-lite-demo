"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimplePublicObjectWithAssociations } from "@hubspot/api-client/lib/codegen/crm/tickets";
import Link from "next/link";

type SortableTicketItemProps = {
  ticket: SimplePublicObjectWithAssociations;
  isUpdating: boolean;
};

export function SortableTicketItem({
  ticket,
  isUpdating,
}: SortableTicketItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: ticket.id,
      data: {
        type: "ticket",
        ticket,
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isUpdating ? 0.5 : 1,
  };

  // Function to determine priority color
  const getPriorityColor = (priority: string | null) => {
    if (!priority) return "bg-sky-200 text-sky-900";

    switch (priority) {
      case "HIGH":
        return "bg-red-200 text-red-900";
      case "MEDIUM":
        return "bg-yellow-200 text-yellow-900";
      default:
        return "bg-sky-200 text-sky-900";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <Link href={`/tickets/${ticket.id}`}>
        <Card className="mb-2 py-0 hover:shadow-md relative">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-base font-medium">
              {ticket.properties.subject || "Unnamed Ticket"}
            </CardTitle>
            <p className="text-sm text-gray-500">
              Created:{" "}
              {ticket.properties.createdate
                ? new Date(ticket.properties.createdate).toLocaleDateString()
                : "N/A"}
            </p>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <p className="text-sm text-gray-600 line-clamp-2">
              {ticket.properties.content || "No description"}
            </p>
            <div className="mt-2"></div>
            <div className="absolute top-3 right-3">
              <span
                className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
                  ticket.properties.hs_ticket_priority
                )}`}
              >
                {ticket.properties.hs_ticket_priority || "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
