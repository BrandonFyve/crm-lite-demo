"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { DealContentClientProps, DealWithCompanies, FormValues } from "./types";
import { useDealDetails } from "./hooks/useDealDetails";
import { useDealStages } from "./hooks/useDealStages";
import { useDealNotes } from "./hooks/useDealNotes";
import { useOwnersCombobox } from "./hooks/useOwnersCombobox";
import { DealHeader } from "./components/DealHeader";
import { DealOverviewForm } from "./components/DealOverviewForm";
import { DealNotesPanel } from "./components/DealNotesPanel";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

async function updateDealDetails(dealId: string, updates: Partial<FormValues>) {
  const response = await fetch(`/api/deals/${dealId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update deal");
  }

  return response.json();
}

function hasChanged(value: string, original?: string | null) {
  return (value ?? "") !== (original ?? "");
}

function DealContentClient({ dealId }: DealContentClientProps) {
  const router = useRouter();
  const { deal, setDeal, error, isLoading } = useDealDetails(dealId);
  const {
    stages,
    isLoading: stagesLoading,
    error: stagesError,
  } = useDealStages();
  // Service and lead-originator custom properties have been removed for the demo.
  const {
    notes,
    noteBody,
    setNoteBody,
    isLoading: isLoadingNotes,
    isAdding: isAddingNote,
    error: notesError,
    addNote,
  } = useDealNotes(dealId);
  const {
    owners,
    isLoading: isLoadingOwners,
    error: ownersError,
  } = useOwnersCombobox();

  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      dealname: "",
      dealstage: "",
      notes: "",
      hubspot_owner_id: "",
    },
  });

  useEffect(() => {
    if (!deal) return;

    if (stagesLoading) {
      return;
    }

    form.reset({
      dealname: deal.properties.dealname || "",
      dealstage: deal.properties.dealstage || "",
      notes: deal.properties.notes || "",
      hubspot_owner_id: deal.properties.hubspot_owner_id || "",
    });
  }, [
    deal,
    stagesLoading,
    form,
  ]);

  const originalDeal = useMemo<DealWithCompanies | null>(() => deal, [deal]);

  const handleOverviewSubmit = async (values: FormValues) => {
    if (!originalDeal) return;
    setIsUpdating(true);

    const updates: Partial<FormValues> = {};
    (Object.keys(values) as (keyof FormValues)[]).forEach((key) => {
      if (hasChanged(values[key], originalDeal.properties[key])) {
        updates[key] = values[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      toast.info("No changes detected");
      setIsUpdating(false);
      return;
    }

    try {
      await updateDealDetails(dealId, updates);
      toast.success("Deal updated successfully");
      setDeal((previous) => {
        if (!previous) return previous;
        const updated: DealWithCompanies = {
          ...previous,
          properties: {
            ...previous.properties,
            ...updates,
          },
        };
        return updated;
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update deal.";
      toast.error(`Error: ${message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || stagesLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-40" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-36 w-full" />
        </div>
      </div>
    );
  }

  if (error && !deal) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.back()} variant="outline">
              Back to Deals
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Deal Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested deal could not be found.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.back()} variant="outline">
              Back to Deals
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <main className="container max-w-4xl mx-auto py-12 px-4">
      <Toaster position="top-right" />

      <DealHeader
        dealId={deal.id}
        dealName={deal.properties.dealname || ""}
        onBack={() => router.back()}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About this deal</CardTitle>
          <CardDescription>Editable properties for this deal</CardDescription>
        </CardHeader>
        <CardContent>
          <DealOverviewForm
            form={form}
            onSubmit={handleOverviewSubmit}
            isSubmitting={isUpdating}
            stages={stages}
            stagesLoading={stagesLoading}
            stagesError={stagesError}
            owners={owners}
            ownersLoading={isLoadingOwners}
            ownersError={ownersError}
            createdDate={deal.properties.createdate || null}
          />
        </CardContent>
      </Card>

      <DealNotesPanel
        notes={notes}
        noteBody={noteBody}
        setNoteBody={setNoteBody}
        isAdding={isAddingNote}
        isLoading={isLoadingNotes}
        error={notesError}
        onAddNote={addNote}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Associated Company</CardTitle>
          <CardDescription>
            Company information associated with this deal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deal.associatedCompanies && deal.associatedCompanies.length > 0 ? (
            <div className="space-y-4">
              {deal.associatedCompanies.map((company) => (
                <div
                  key={company.id}
                  className="border rounded-lg p-4 bg-muted/10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Company Name
                      </label>
                      <p className="text-sm font-semibold">
                        {company.properties.name || "Not specified"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Company ID
                      </label>
                      <p className="text-sm">{company.id || "Not specified"}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Company Created Date
                      </label>
                      <p className="text-sm">
                        {company.properties.createdate
                          ? new Date(
                              company.properties.createdate
                            ).toLocaleDateString()
                          : "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No associated company found for this deal
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default DealContentClient;
