import { NextRequest, NextResponse } from "next/server";
import { hubspotClient } from "@/lib/hubspot";
import { SimplePublicObjectInputForCreate } from "@hubspot/api-client/lib/codegen/crm/objects/notes";
import {
  AssociationSpec,
  AssociationSpecAssociationCategoryEnum,
} from "@hubspot/api-client/lib/codegen/crm/associations/v4";

// Define a type for the expected HubSpot API error structure
type HubSpotApiErrorResponse = {
  response?: {
    statusCode?: number;
    body?: { message?: string };
  };
  message?: string;
};

// Helper function to check if an error is a HubSpot API error
function isHubSpotApiError(error: unknown): error is HubSpotApiErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    ("response" in error || "message" in error)
  );
}

// Define the Params type as a Promise
type Params = Promise<{ ticketId: string }>;

// POST handler to add a note to a ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { ticketId } = await params;
  let body: { noteBody: string };

  if (!ticketId) {
    return NextResponse.json(
      { message: "Ticket ID is required" },
      { status: 400 }
    );
  }

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body" },
      { status: 400 }
    );
  }

  if (
    !body ||
    typeof body.noteBody !== "string" ||
    body.noteBody.trim() === ""
  ) {
    return NextResponse.json(
      { message: "Note body is required and cannot be empty" },
      { status: 400 }
    );
  }

  try {
    // 1. Create the Note object
    const noteInput: SimplePublicObjectInputForCreate = {
      properties: {
        hs_timestamp: new Date().toISOString(), // Set the note creation time
        hs_note_body: body.noteBody, // The content of the note
        // hubspot_owner_id: "" // Optional: Assign an owner ID if known/needed
      },
      associations: [], // Required by SimplePublicObjectInputForCreate
    };
    const createdNote = await hubspotClient.crm.objects.notes.basicApi.create(
      noteInput
    );

    // 2. Associate the newly created Note with the existing Ticket using V4 API
    const associationSpec: AssociationSpec = {
      associationTypeId: 227, // Note associated with Ticket type ID
      associationCategory:
        AssociationSpecAssociationCategoryEnum.HubspotDefined,
    };

    // await hubspotClient.crm.associations.v4.basicApi.create(
    //   "note", // From Object Type
    //   createdNote.id, // From Object ID (the new note)
    //   "ticket", // To Object Type
    //   ticketId, // To Object ID (the existing ticket)
    //   [associationSpec] // Association specs in an array
    // );

    await hubspotClient.crm.associations.v4.basicApi.create(
      "ticket", // From Object Type
      ticketId, // From Object ID (the new note)
      "note", // To Object Type
      createdNote.id, // To Object ID (the existing ticket)
      [associationSpec] // Association specs in an array
    );

    // Return the created note or just a success message
    return NextResponse.json(
      { message: "Note added successfully", noteId: createdNote.id },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error(`Error adding note to ticket ${ticketId}:`, error);
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
        // Could be the ticket doesn't exist, or an association issue
        errorMessage =
          error.response?.body?.message ||
          "Could not create/associate note (Ticket or Note not found?).";
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
