"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { SimplePublicObjectWithAssociations } from "@hubspot/api-client/lib/codegen/crm/tickets";
import type { PipelineStage } from "@hubspot/api-client/lib/codegen/crm/pipelines";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";

async function getTicketDetails(
  ticketId: string,
): Promise<SimplePublicObjectWithAssociations> {
  const response = await fetch(`/api/tickets/${ticketId}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch ticket details");
  }
  return response.json();
}

async function getTicketStages(): Promise<PipelineStage[]> {
  const response = await fetch(`/api/tickets/stages`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch ticket stages");
  }
  return response.json();
}

async function updateTicketDetails(
  ticketId: string,
  updates: { hs_pipeline_stage?: string },
) {
  const response = await fetch(`/api/tickets/${ticketId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update ticket");
  }
  return response.json();
}

async function addNoteToTicket(ticketId: string, noteBody: string) {
  const response = await fetch(`/api/tickets/${ticketId}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ noteBody }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to add note");
  }
  return response.json();
}

interface TicketContentClientProps {
  ticketId: string;
}

interface FormValues {
  hs_pipeline_stage: string;
}

function TicketContentClient({ ticketId }: TicketContentClientProps) {
  const router = useRouter();
  const [ticket, setTicket] =
    useState<SimplePublicObjectWithAssociations | null>(null);
  const [ticketStages, setTicketStages] = useState<PipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [noteBody, setNoteBody] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: { hs_pipeline_stage: "" },
  });

  useEffect(() => {
    if (!ticketId) return;

    setIsLoading(true);
    setError(null);

    getTicketDetails(ticketId)
      .then((data) => {
        setTicket(data);
        form.reset({
          hs_pipeline_stage: data.properties.hs_pipeline_stage || "",
        });
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Failed to load ticket.");
        toast.error("Failed to load ticket details");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [ticketId, form]);

  useEffect(() => {
    setStagesLoading(true);
    getTicketStages()
      .then(setTicketStages)
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load ticket stages");
      })
      .finally(() => setStagesLoading(false));
  }, []);

  const onSubmit = async (values: FormValues) => {
    setIsUpdating(true);

    const updates: { hs_pipeline_stage?: string } = {};

    if (
      values.hs_pipeline_stage !== (ticket?.properties.hs_pipeline_stage || "")
    ) {
      updates.hs_pipeline_stage = values.hs_pipeline_stage;
    }

    if (Object.keys(updates).length === 0) {
      toast.info("No changes detected");
      setIsUpdating(false);
      return;
    }

    try {
      await updateTicketDetails(ticketId, updates);
      toast.success("Ticket updated successfully");

      if (ticket) {
        const updatedTicket = { ...ticket };
        if (updates.hs_pipeline_stage)
          updatedTicket.properties.hs_pipeline_stage =
            updates.hs_pipeline_stage;
        setTicket(updatedTicket);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update ticket.";
      toast.error(`Error: ${message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteBody.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

    setIsAddingNote(true);

    try {
      await addNoteToTicket(ticketId, noteBody);
      toast.success("Note added successfully");
      setNoteBody("");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to add note.";
      toast.error(`Error: ${message}`);
    } finally {
      setIsAddingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-6 p-8 max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-20" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-60 mb-2" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <Button onClick={() => router.push("/tickets")} className="mt-6" variant="outline">
          Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-8 max-w-4xl mx-auto w-full">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ticket Details</h1>
        <Button onClick={() => router.push("/tickets")} variant="outline">
          Back to Tickets
        </Button>
      </div>

      {ticket && (
        <Card>
          <CardHeader>
            <CardTitle>{ticket.properties.subject || "Unnamed Ticket"}</CardTitle>
            <CardDescription>
              Created: {ticket.properties.createdate
                ? new Date(ticket.properties.createdate).toLocaleDateString()
                : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="whitespace-pre-wrap">
                  {ticket.properties.content || "No description provided."}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Priority</h3>
              <div className="p-2 bg-gray-50 rounded-md inline-block">
                <span
                  className={`font-medium ${
                    ticket.properties.hs_ticket_priority === "HIGH"
                      ? "text-red-700"
                      : ticket.properties.hs_ticket_priority === "MEDIUM"
                      ? "text-yellow-700"
                      : "text-blue-700"
                  }`}
                >
                  {ticket.properties.hs_ticket_priority || "Not set"}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Update Ticket Stage</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="hs_pipeline_stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pipeline Stage</FormLabel>
                        <Select
                          disabled={stagesLoading || isUpdating}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a pipeline stage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ticketStages.map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>
                                {stage.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? "Saving..." : "Update Ticket"}
                  </Button>
                </form>
              </Form>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Add Note</h3>
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your note here..."
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  disabled={isAddingNote}
                  className="min-h-[100px]"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={isAddingNote || !noteBody.trim()}
                >
                  {isAddingNote ? "Adding..." : "Add Note"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TicketContentClient;

export type { TicketContentClientProps };


