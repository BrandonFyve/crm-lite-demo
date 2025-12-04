"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeHtml } from "@/lib/utils";
import { DealNote } from "../types";

interface DealNotesPanelProps {
  notes: DealNote[];
  noteBody: string;
  setNoteBody: (value: string) => void;
  isAdding: boolean;
  isLoading: boolean;
  error: string | null;
  onAddNote: () => Promise<void> | void;
}

export function DealNotesPanel({
  notes,
  noteBody,
  setNoteBody,
  isAdding,
  isLoading,
  error,
  onAddNote,
}: DealNotesPanelProps) {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Add Note</CardTitle>
          <CardDescription>Add a note to this deal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your note here..."
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              className="min-h-[120px]"
            />
            <Button
              onClick={onAddNote}
              className="w-full"
              disabled={isAdding || !noteBody.trim()}
            >
              {isAdding ? "Adding Note..." : "Add Note"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>All notes associated with this deal</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton data-testid="notes-loading-skeleton" className="h-20 w-full" />
              <Skeleton data-testid="notes-loading-skeleton" className="h-20 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-2">Error loading notes</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No notes found for this deal</p>
              <p className="text-sm text-muted-foreground">Add a note using the form to the left</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4 bg-muted/10">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-muted-foreground">
                      {new Date(note.properties.hs_timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <div
                      className="text-sm [&_p]:my-1 [&_strong]:font-semibold [&_span[data-mention-name]]:bg-blue-100 [&_span[data-mention-name]]:px-1 [&_span[data-mention-name]]:rounded [&_span[data-mention-name]]:text-blue-800"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(note.properties.hs_note_body),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

