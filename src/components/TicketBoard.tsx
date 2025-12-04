"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SimplePublicObjectWithAssociations } from "@hubspot/api-client/lib/codegen/crm/tickets";
import { toast } from "sonner";
import { SortableTicketItem } from "./SortableTicketItem";

type TicketBoardProps = {
  tickets: SimplePublicObjectWithAssociations[];
  stages: {
    id: string;
    label: string;
  }[];
};

// Create a DroppableColumn component before the main TicketBoard component
function DroppableColumn({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  );
}

export default function TicketBoard({ tickets, stages }: TicketBoardProps) {
  const [columns, setColumns] = useState<
    Record<string, SimplePublicObjectWithAssociations[]>
  >({});
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] =
    useState<SimplePublicObjectWithAssociations | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Only start dragging after moving 5px to avoid accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Organize tickets by stage
  useEffect(() => {
    const columnMap: Record<string, SimplePublicObjectWithAssociations[]> = {};

    // Initialize columns for all stages, even empty ones
    stages.forEach((stage) => {
      columnMap[stage.id] = [];
    });

    // Add tickets to appropriate columns
    tickets.forEach((ticket) => {
      const stageId = ticket.properties.hs_pipeline_stage;
      if (stageId && columnMap[stageId]) {
        columnMap[stageId].push(ticket);
      } else if (stageId) {
        // Handle the case where stage exists in ticket but not in our stages list
        columnMap[stageId] = [ticket];
      }
    });

    setColumns(columnMap);
  }, [tickets, stages]);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const ticketId = active.id as string;

    // Find the ticket that is being dragged
    let draggedTicket: SimplePublicObjectWithAssociations | undefined;

    Object.values(columns).forEach((columnTickets) => {
      const found = columnTickets.find((ticket) => ticket.id === ticketId);
      if (found) {
        draggedTicket = found;
      }
    });

    if (draggedTicket) {
      setActiveTicket(draggedTicket);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTicket(null); // Clear the active ticket

    const { active, over } = event;

    if (!over) return;

    const ticketId = active.id as string;

    // Make sure we're only handling ticket items
    if (active.data.current?.type !== "ticket") return;

    // Get the stage ID from the over element
    // If we're dropping on another ticket, we need to find the parent column
    let newStageId = over.id as string;

    // Check if the newStageId is actually a ticket ID rather than a stage ID
    const validStageIds = ["1", "2", "3", "4"];

    // If it's not a valid stage ID, it's probably a ticket ID
    if (!validStageIds.includes(newStageId)) {
      // Find which column contains this ticket ID
      let containingColumn = "";
      Object.entries(columns).forEach(([columnId, tickets]) => {
        if (tickets.some((ticket) => ticket.id === newStageId)) {
          containingColumn = columnId;
        }
      });

      if (containingColumn) {
        newStageId = containingColumn;
      } else {
        // We couldn't determine the target column, so abort
        console.error(
          `Could not determine target column for drop target with ID: ${newStageId}`
        );
        return;
      }
    }

    // Find the ticket that was dragged
    let draggedTicket: SimplePublicObjectWithAssociations | undefined;
    let sourceColumnId: string | undefined;

    Object.entries(columns).forEach(([columnId, columnTickets]) => {
      const foundTicket = columnTickets.find(
        (ticket) => ticket.id === ticketId
      );
      if (foundTicket) {
        draggedTicket = foundTicket;
        sourceColumnId = columnId;
      }
    });

    if (!draggedTicket || !sourceColumnId || sourceColumnId === newStageId)
      return;

    // Optimistically update UI
    setIsUpdating(ticketId);

    const newColumns = { ...columns };
    newColumns[sourceColumnId] = newColumns[sourceColumnId].filter(
      (ticket) => ticket.id !== ticketId
    );

    // Create a copy of the ticket with updated stage
    const updatedTicket = {
      ...draggedTicket,
      properties: {
        ...draggedTicket.properties,
        hs_pipeline_stage: newStageId,
      },
    };

    if (!newColumns[newStageId]) {
      newColumns[newStageId] = [];
    }
    newColumns[newStageId].push(updatedTicket);
    setColumns(newColumns);

    try {
      // Update in HubSpot
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hs_pipeline_stage: newStageId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.message || "Failed to update ticket stage");
      }

      toast.success("Ticket moved successfully");
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error(
        `Failed to update ticket stage: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      // Revert the UI if the API call fails
      if (sourceColumnId) {
        const revertColumns = { ...columns };
        revertColumns[newStageId] = revertColumns[newStageId].filter(
          (ticket) => ticket.id !== ticketId
        );
        revertColumns[sourceColumnId].push(draggedTicket);
        setColumns(revertColumns);
      }
    } finally {
      setIsUpdating(null);
    }
  }

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-4 min-w-max pb-4">
          {stages.map((stage) => (
            <DroppableColumn
              key={stage.id}
              id={stage.id}
              className="w-80 flex-shrink-0"
            >
              <div className="bg-gray-100 p-4">
                <h3 className="font-medium text-gray-800 mb-3">
                  {stage.label}
                </h3>
                <div className="space-y-3 min-h-[200px]">
                  <SortableContext
                    items={columns[stage.id]?.map((ticket) => ticket.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {columns[stage.id]?.map((ticket) => (
                      <SortableTicketItem
                        key={ticket.id}
                        ticket={ticket}
                        isUpdating={isUpdating === ticket.id}
                      />
                    ))}
                  </SortableContext>

                  {!columns[stage.id]?.length && (
                    <div className="text-center p-4 text-gray-500 border border-dashed">
                      No tickets in this stage
                    </div>
                  )}
                </div>
              </div>
            </DroppableColumn>
          ))}
        </div>

        {/* Drag overlay to show the dragged item */}
        <DragOverlay>
          {activeTicket ? (
            <div className="w-72">
              <SortableTicketItem ticket={activeTicket} isUpdating={false} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
