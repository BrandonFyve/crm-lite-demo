import { NextRequest, NextResponse } from "next/server";
import { hubspotClient } from "@/lib/hubspot";
import { ticketIdParamsSchema, ticketStageUpdateSchema } from "@/validators/ticket";

// Define the properties we want to fetch/update
const ticketProperties = [
  "subject",
  "content",
  "hs_pipeline_stage",
  "hs_ticket_priority",
  "createdate",
  "hubspot_owner_id",
];

// Define a type for the expected HubSpot API error structure
type HubSpotApiErrorResponse = {
  response?: {
    statusCode?: number;
    body?: {
      // Include body for potential messages
      message?: string;
    };
  };
  message?: string; // General error message
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

// GET handler to fetch a single ticket by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  const parsedParams = ticketIdParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json(
      { message: parsedParams.error.issues[0]?.message ?? "Ticket ID is required" },
      { status: 400 },
    );
  }
  const { ticketId } = parsedParams.data;

  try {
    const ticket = await hubspotClient.crm.tickets.basicApi.getById(
      ticketId,
      ticketProperties
    );
    return NextResponse.json(ticket);
  } catch (error: unknown) {
    console.error(`Error fetching ticket ${ticketId}:`, error);
    let errorMessage = "Failed to fetch ticket details.";
    let statusCode = 500;

    if (isHubSpotApiError(error)) {
      if (error.response?.statusCode === 404) {
        errorMessage = error.response?.body?.message || "Ticket not found.";
        statusCode = 404;
      } else if (error.response?.statusCode === 401) {
        errorMessage =
          error.response?.body?.message ||
          "HubSpot authentication error. Check API key.";
        statusCode = 401;
      } else if (error.message) {
        errorMessage = error.message; // Use general message if specific codes aren't matched
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
}

// PATCH handler to update a ticket by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  const parsedParams = ticketIdParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json(
      { message: parsedParams.error.issues[0]?.message ?? "Ticket ID is required" },
      { status: 400 },
    );
  }
  const { ticketId } = parsedParams.data;

  const body = await request.json().catch(() => null);
  const parsedBody = ticketStageUpdateSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: parsedBody.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 },
    );
  }

  const propertiesToUpdate: { [key: string]: string } = {
    hs_pipeline_stage: parsedBody.data.hs_pipeline_stage,
  };

  try {
    const updatedTicket = await hubspotClient.crm.tickets.basicApi.update(
      ticketId,
      {
        properties: propertiesToUpdate,
      }
    );
    return NextResponse.json(updatedTicket);
  } catch (error: unknown) {
    console.error(`Error updating ticket ${ticketId}:`, error);
    let errorMessage = "Failed to update ticket.";
    let statusCode = 500;

    if (isHubSpotApiError(error)) {
      if (error.response?.statusCode === 404) {
        errorMessage = error.response?.body?.message || "Ticket not found.";
        statusCode = 404;
      } else if (error.response?.statusCode === 401) {
        errorMessage =
          error.response?.body?.message ||
          "HubSpot authentication error. Check API key.";
        statusCode = 401;
      } else if (error.message) {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ message: errorMessage }, { status: statusCode });
  }
}
