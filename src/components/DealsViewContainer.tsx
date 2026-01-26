"use client";

import { useMemo, useState, useEffect } from "react";
import { SimplePublicObjectWithAssociations } from "@hubspot/api-client/lib/codegen/crm/deals";
import { LayoutGrid, Table, Check, ChevronsUpDown, Download } from "lucide-react";
import { toast } from "sonner";
import DealBoard from "./DealBoard";
import DealTable from "./DealTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OwnerSummary } from "@/lib/hubspot-owners";
import type { Pipeline } from "@/lib/hubspot-deals";

interface DealsViewContainerProps {
  deals: SimplePublicObjectWithAssociations[];
  pipelines: Pipeline[];
  initialOwners: OwnerSummary[];
}

type ViewMode = "kanban" | "table";

export default function DealsViewContainer({ 
  deals, 
  pipelines,
  initialOwners,
}: DealsViewContainerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [ownerPopoverOpen, setOwnerPopoverOpen] = useState<boolean>(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(
    pipelines.length > 0 ? pipelines[0].id : ""
  );
  const [filteredDealsForPipeline, setFilteredDealsForPipeline] = useState<
    SimplePublicObjectWithAssociations[]
  >([]);

  // Get selected pipeline and its stages
  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const stages = selectedPipeline
    ? selectedPipeline.stages.map(({ id, label }) => ({ id, label }))
    : [];

  // Fetch deals for selected pipeline when it changes
  useEffect(() => {
    const fetchDealsForPipeline = async () => {
      if (!selectedPipelineId) {
        setFilteredDealsForPipeline([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/deals?pipelineId=${selectedPipelineId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch deals");
        }
        const data = await response.json();
        setFilteredDealsForPipeline(data);
      } catch (error) {
        console.error("Error fetching deals for pipeline:", error);
        toast.error("Failed to load deals for selected pipeline");
        setFilteredDealsForPipeline([]);
      }
    };

    fetchDealsForPipeline();
  }, [selectedPipelineId]);

  // Use server-provided owners instead of fetching client-side
  const owners = initialOwners;
  const isLoadingOwners = false;
  const ownersError = null;

  const filteredDeals = useMemo(() => {
    // Start with deals from selected pipeline
    let filtered = filteredDealsForPipeline;

    // Filter by owner
    if (selectedOwnerId) {
      filtered = filtered.filter((deal) => {
        const value = deal.properties?.["hubspot_owner_id"];
        return typeof value === "string" ? value === selectedOwnerId : false;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((deal) =>
        deal.properties.dealname?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [filteredDealsForPipeline, selectedOwnerId, searchTerm]);

  const selectedOwner = owners.find((o) => String(o.id) === selectedOwnerId);
  const ownerButtonLabel = selectedOwner
    ? `${selectedOwner.firstName || ''} ${selectedOwner.lastName || ''}`.trim() || selectedOwner.email || String(selectedOwner.id)
    : (selectedOwnerId || "Filter by owner...");

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/deals/export", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to export deals");
      }

      const { downloadUrl } = await response.json();

      // Trigger browser download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Deals exported successfully");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to export deals";
      toast.error(`Export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-full">
      {/* View Toggle */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>View Options</span>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className="flex items-center gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="flex items-center gap-2"
              >
                <Table className="h-4 w-4" />
                Table
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Select
                value={selectedPipelineId}
                onValueChange={setSelectedPipelineId}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Popover open={ownerPopoverOpen} onOpenChange={setOwnerPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={ownerPopoverOpen}
                    className="w-64 justify-between"
                    disabled={isLoadingOwners || !!ownersError}
                  >
                    {isLoadingOwners ? "Loading owners..." : ownerButtonLabel || "Filter by owner..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0">
                  <Command shouldFilter={true}>
                    <CommandInput placeholder="Search owners..." />
                    <CommandEmpty>No owners found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup heading="Owners">
                        <CommandItem
                          key="__any__"
                          value="__any__"
                          onSelect={() => {
                            setSelectedOwnerId("");
                            setOwnerPopoverOpen(false);
                          }}
                        >
                          <div className="mr-2 h-4 w-4" />
                          Any owner
                        </CommandItem>
                        {owners.map((owner) => {
                          const label = `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email || String(owner.id);
                          const isSelected = String(owner.id) === selectedOwnerId;
                          return (
                            <CommandItem
                              key={owner.id}
                              value={label}
                              onSelect={() => {
                                setSelectedOwnerId(String(owner.id));
                                setOwnerPopoverOpen(false);
                              }}
                            >
                              <Check className={`mr-2 h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                              {label}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedOwnerId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOwnerId("")}
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {ownersError && (
                <span className="text-sm text-red-600">{ownersError}</span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content based on view mode */}
      {viewMode === "kanban" ? (
        <DealBoard deals={filteredDeals} stages={stages} />
      ) : (
        <DealTable deals={filteredDeals} stages={stages} />
      )}
    </div>
  );
} 