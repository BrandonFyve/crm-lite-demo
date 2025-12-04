import { NextRequest, NextResponse } from "next/server";
import { hubspotClient } from "@/lib/hubspot";
import { SimplePublicObjectInputForCreate } from "@hubspot/api-client/lib/codegen/crm/objects/notes";
import {
  AssociationSpec,
  AssociationSpecAssociationCategoryEnum,
} from "@hubspot/api-client/lib/codegen/crm/associations/v4";
import { noteCreateSchema, noteParamsSchema } from "@/validators/note";

// Define a type for the expected HubSpot API error structure (can be reused)
type HubSpotApiErrorResponse = {
  response?: {
    statusCode?: number;
    body?: { message?: string };
  };
  message?: string;
};

// Helper function to check if an error is a HubSpot API error (can be reused)
function isHubSpotApiError(error: unknown): error is HubSpotApiErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    ("response" in error || "message" in error)
  );
}

// Define the Params type as a Promise
type Params = Promise<{ dealId: string }>;

// GET handler to fetch notes associated with a deal
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  const parsedParams = noteParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json(
      { message: parsedParams.error.issues[0]?.message ?? "Deal ID is required" },
      { status: 400 },
    );
  }
  const { dealId } = parsedParams.data;

  try {
    // 1. Get associated note IDs for the deal
    const associations = await hubspotClient.crm.associations.v4.basicApi.getPage(
      "deal",
      dealId,
      "note"
    );

    if (!associations.results || associations.results.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Fetch the actual note objects
    const noteIds = associations.results.map(assoc => assoc.toObjectId);
    const notes = [];

    for (const noteId of noteIds) {
      try {
        const note = await hubspotClient.crm.objects.notes.basicApi.getById(
          noteId,
          ["hs_note_body", "hs_timestamp", "hubspot_owner_id"]
        );
        notes.push(note);
      } catch (error) {
        console.warn(`Failed to fetch note ${noteId}:`, error);
        // Continue with other notes if one fails
      }
    }

    // Sort notes by timestamp (newest first)
    notes.sort((a, b) => {
      const timeA = new Date(a.properties.hs_timestamp || 0).getTime();
      const timeB = new Date(b.properties.hs_timestamp || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json(notes);
  } catch (error: unknown) {
    console.error(`Error fetching notes for deal ${dealId}:`, error);
    let errorMessage = "Failed to fetch notes.";
    let statusCode = 500;

    if (isHubSpotApiError(error)) {
      if (error.response?.statusCode === 401) {
        errorMessage =
          error.response?.body?.message ||
          "HubSpot authentication error. Check API key.";
        statusCode = 401;
      } else if (error.response?.statusCode === 404) {
        errorMessage =
          error.response?.body?.message ||
          "Deal not found or no associated notes.";
        statusCode = 404;
      } else if (error.message) {
        errorMessage = `Failed to fetch notes: ${error.message}`;
      }
    } else if (error instanceof Error) {
      errorMessage = `Failed to fetch notes: ${error.message}`;
    }

    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
}

// POST handler to add a note to a deal
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  const parsedParams = noteParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json(
      { message: parsedParams.error.issues[0]?.message ?? "Deal ID is required" },
      { status: 400 },
    );
  }
  const { dealId } = parsedParams.data;

  const body = await request.json().catch(() => null);
  const parsedBody = noteCreateSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: parsedBody.error.issues[0]?.message ?? "Note body is required" },
      { status: 400 },
    );
  }

  try {
    // 1. Create the Note object
    const noteInput: SimplePublicObjectInputForCreate = {
      properties: {
        hs_timestamp: new Date().toISOString(), // Set the note creation time
        hs_note_body: parsedBody.data.noteBody, // The content of the note
        // hubspot_owner_id: "" // Optional: Assign an owner ID if known/needed
      },
      associations: [], // Required by SimplePublicObjectInputForCreate
    };
    const createdNote = await hubspotClient.crm.objects.notes.basicApi.create(
      noteInput
    );

    // 2. Associate the newly created Note with the existing Deal using V4 API
    const associationSpec: AssociationSpec = {
      associationTypeId: 214, // Note associated with Deal type ID
      associationCategory:
        AssociationSpecAssociationCategoryEnum.HubspotDefined,
    };

    await hubspotClient.crm.associations.v4.basicApi.create(
      "note", // From Object Type
      createdNote.id, // From Object ID (the new note)
      "deal", // To Object Type
      dealId, // To Object ID (the existing deal)
      [associationSpec] // Association specs in an array
    );

    // Optionally return the created note or just a success message
    return NextResponse.json(
      { message: "Note added successfully", noteId: createdNote.id },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error(`Error adding note to deal ${dealId}:`, error);
    let errorMessage = "Failed to add note.";
    let statusCode = 500;

    if (isHubSpotApiError(error)) {
      // Handle potential association errors or note creation errors
      if (error.response?.statusCode === 401) {
        errorMessage =
          error.response?.body?.message ||
          "HubSpot authentication error. Check API key.";
        statusCode = 401;
      } else if (error.response?.statusCode === 404) {
        // Could be the deal doesn't exist, or an association issue
        errorMessage =
          error.response?.body?.message ||
          "Could not create/associate note (Deal or Note not found?).";
        statusCode = 404;
      } else if (error.message) {
        errorMessage = `Failed to add note: ${error.message}`;
      }
    } else if (error instanceof Error) {
      errorMessage = `Failed to add note: ${error.message}`;
    }

    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
}
