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
import { SimplePublicObjectWithAssociations } from "@hubspot/api-client/lib/codegen/crm/deals";
import { toast } from "sonner";
import { SortableDealItem } from "./SortableDealItem";

type DealBoardProps = {
  deals: SimplePublicObjectWithAssociations[];
  stages: {
    id: string;
    label: string;
  }[];
};

// Create a DroppableColumn component before the main DealBoard component
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

export default function DealBoard({ deals, stages }: DealBoardProps) {
  const [columns, setColumns] = useState<
    Record<string, SimplePublicObjectWithAssociations[]>
  >({});
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [activeDeal, setActiveDeal] =
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

  // Organize deals by stage
  useEffect(() => {
    const columnMap: Record<string, SimplePublicObjectWithAssociations[]> = {};

    // Initialize columns for all stages, even empty ones
    stages.forEach((stage) => {
      columnMap[stage.id] = [];
    });

    // Add deals to appropriate columns
    deals.forEach((deal) => {
      const stageId = deal.properties.dealstage;
      if (stageId && columnMap[stageId]) {
        columnMap[stageId].push(deal);
      } else if (stageId) {
        // Handle the case where stage exists in deal but not in our stages list
        columnMap[stageId] = [deal];
      }
    });

    setColumns(columnMap);
  }, [deals, stages]);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const dealId = active.id as string;

    // Find the deal that is being dragged
    let draggedDeal: SimplePublicObjectWithAssociations | undefined;

    Object.values(columns).forEach((columnDeals) => {
      const found = columnDeals.find((deal) => deal.id === dealId);
      if (found) {
        draggedDeal = found;
      }
    });

    if (draggedDeal) {
      setActiveDeal(draggedDeal);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null); // Clear the active deal

    const { active, over } = event;

    if (!over) return;

    const dealId = active.id as string;

    // Make sure we're only handling deal items
    if (active.data.current?.type !== "deal") return;

    // Get the stage id from the over element
    // If we're dropping on another deal, we need to find the parent column
    let newStageId = over.id as string;

    // Check if the newStageId is actually a deal ID (numeric) rather than a stage ID (string like "qualifiedtobuy")
    const validStageIds = [
      "appointmentscheduled",
      "qualifiedtobuy",
      "presentationscheduled",
      "decisionmakerboughtin",
      "contractsent",
      "closedwon",
      "closedlost",
    ];

    // If it's not a valid stage ID, it's probably a deal ID
    if (!validStageIds.includes(newStageId)) {
      // Find which column contains this deal ID
      let containingColumn = "";
      Object.entries(columns).forEach(([columnId, deals]) => {
        if (deals.some((deal) => deal.id === newStageId)) {
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

    // Find the deal that was dragged
    let draggedDeal: SimplePublicObjectWithAssociations | undefined;
    let sourceColumnId: string | undefined;

    Object.entries(columns).forEach(([columnId, columnDeals]) => {
      const foundDeal = columnDeals.find((deal) => deal.id === dealId);
      if (foundDeal) {
        draggedDeal = foundDeal;
        sourceColumnId = columnId;
      }
    });

    if (!draggedDeal || !sourceColumnId || sourceColumnId === newStageId)
      return;

    // Optimistically update UI
    setIsUpdating(dealId);

    const newColumns = { ...columns };
    newColumns[sourceColumnId] = newColumns[sourceColumnId].filter(
      (deal) => deal.id !== dealId
    );

    // Create a copy of the deal with updated stage
    const updatedDeal = {
      ...draggedDeal,
      properties: {
        ...draggedDeal.properties,
        dealstage: newStageId,
      },
    };

    if (!newColumns[newStageId]) {
      newColumns[newStageId] = [];
    }
    newColumns[newStageId].push(updatedDeal);
    setColumns(newColumns);

    try {
      // Update in HubSpot
      const response = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dealstage: newStageId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.message || "Failed to update deal stage");
      }

      toast.success("Deal moved successfully");
    } catch (error) {
      console.error("Error updating deal:", error);
      toast.error(
        `Failed to update deal stage: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      // Revert the UI if the API call fails
      if (sourceColumnId) {
        const revertColumns = { ...columns };
        revertColumns[newStageId] = revertColumns[newStageId].filter(
          (deal) => deal.id !== dealId
        );
        revertColumns[sourceColumnId].push(draggedDeal);
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
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
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
                    items={columns[stage.id]?.map((deal) => deal.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {columns[stage.id]?.map((deal) => (
                      <SortableDealItem
                        key={deal.id}
                        deal={deal}
                        isUpdating={isUpdating === deal.id}
                      />
                    ))}
                  </SortableContext>

                  {!columns[stage.id]?.length && (
                    <div className="text-center p-4 text-gray-500 border border-dashed">
                      No deals in this stage
                    </div>
                  )}
                </div>
              </div>
            </DroppableColumn>
          ))}
        </div>
        <DragOverlay>
          {activeDeal && (
            <SortableDealItem
              deal={activeDeal}
              isUpdating={isUpdating === activeDeal.id}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
