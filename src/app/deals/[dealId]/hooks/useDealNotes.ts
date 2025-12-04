import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { DealNote } from "../types";

async function fetchDealNotes(dealId: string): Promise<DealNote[]> {
  const response = await fetch(`/api/deals/${dealId}/notes`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch notes");
  }
  return response.json();
}

async function createDealNote(dealId: string, noteBody: string) {
  const response = await fetch(`/api/deals/${dealId}/notes`, {
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

export function useDealNotes(dealId: string) {
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [noteBody, setNoteBody] = useState("" );
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchDealNotes(dealId);
      setNotes(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load notes.";
      setError(message);
      toast.error("Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    if (!dealId) return;
    void loadNotes();
  }, [dealId, loadNotes]);

  const addNote = useCallback(async () => {
    if (!noteBody.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

    setIsAdding(true);

    try {
      await createDealNote(dealId, noteBody);
      toast.success("Note added successfully");
      setNoteBody("" );
      await loadNotes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add note.";
      toast.error(`Error: ${message}`);
    } finally {
      setIsAdding(false);
    }
  }, [dealId, noteBody, loadNotes]);

  return {
    notes,
    noteBody,
    setNoteBody,
    isLoading,
    isAdding,
    error,
    addNote,
  } as const;
}

