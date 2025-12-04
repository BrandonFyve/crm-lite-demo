import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dealUpdateSchema } from "@/validators/deal";
import { hubspotClient } from "@/lib/hubspot";
import { getDealStages } from "@/lib/hubspot-deals";

// Define the properties we want to fetch/update
// For demo purposes, restrict to default HubSpot deal properties only
const dealProperties = [
  "dealname",
  "amount",
  "closedate",
  "dealstage",
  "hubspot_owner_id",
  "createdate",
  "notes",
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
const paramsSchema = z.object({ dealId: z.string().min(1) });

// GET handler to fetch a single deal by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ message: "Deal ID is required" }, { status: 400 });
  }
  const { dealId } = parsedParams.data;

  try {
    // 1. Get the deal details
    const deal = await hubspotClient.crm.deals.basicApi.getById(
      dealId,
      dealProperties
    );

    // 2. Get owner information
    let ownerInfo = null;
    if (deal.properties.hubspot_owner_id) {
      try {
        const ownerIdNumber = parseInt(deal.properties.hubspot_owner_id);
        const owner = await hubspotClient.crm.owners.ownersApi.getById(
          ownerIdNumber
        );
        ownerInfo = {
          id: owner.id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email
        };
      } catch (error) {
        console.warn(`Failed to fetch owner ${deal.properties.hubspot_owner_id}:`, error);
        // Continue without owner data if owner fetch fails
      }
    }

    // 3. Get associated companies
    const companies: Array<{
      id: string;
      properties: {
        name?: string;
        createdate?: string;
        hs_object_id?: string;
      };
    }> = [];
    try {
      const companyAssociations = await hubspotClient.crm.associations.v4.basicApi.getPage(
        "deal",
        dealId,
        "company"
      );

      if (companyAssociations.results && companyAssociations.results.length > 0) {
        // Fetch company details for each associated company
        for (const association of companyAssociations.results) {
          try {
            const company = await hubspotClient.crm.companies.basicApi.getById(
              association.toObjectId,
              ["name", "createdate", "hs_object_id"]
            );
            companies.push(company);
          } catch (error) {
            console.warn(`Failed to fetch company ${association.toObjectId}:`, error);
            // Continue with other companies if one fails
          }
        }
      }
    } catch (error) {
      console.warn("Failed to fetch company associations:", error);
      // Continue without company data if associations fail
    }

    // 4. Return deal with company and owner information
    return NextResponse.json({
      ...deal,
      associatedCompanies: companies,
      ownerInfo: ownerInfo
    });
  } catch (error: unknown) {
    console.error(`Error fetching deal ${dealId}:`, error);
    let errorMessage = "Failed to fetch deal details.";
    let statusCode = 500;

    if (isHubSpotApiError(error)) {
      if (error.response?.statusCode === 404) {
        errorMessage = error.response?.body?.message || "Deal not found.";
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

// PATCH handler to update a deal by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ message: "Deal ID is required" }, { status: 400 });
  }
  const { dealId } = parsedParams.data;

  const body = await request.json().catch(() => null);
  const parsedPayload = dealUpdateSchema.safeParse(body);

  if (!parsedPayload.success) {
    return NextResponse.json(
      { message: parsedPayload.error.errors?.[0]?.message ?? "Invalid request body" },
      { status: 400 },
    );
  }

  const propertiesToUpdate = Object.entries(parsedPayload.data).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (typeof value === "string") {
        // Validate dealstage if present
        if (key === "dealstage") {
          // We'll validate this against available stages below
          acc[key] = value;
        } else {
          acc[key] = value;
        }
      }
      return acc;
    },
    {},
  );

  // Validate dealstage if it's being updated
  if (propertiesToUpdate.dealstage !== undefined) {
    const stages = await getDealStages();
    const validStageIds = new Set(stages.map((stage) => stage.id));
    
    if (propertiesToUpdate.dealstage && !validStageIds.has(propertiesToUpdate.dealstage)) {
      return NextResponse.json(
        { message: `Invalid dealstage: ${propertiesToUpdate.dealstage} is not a valid stage ID` },
        { status: 400 }
      );
    }
    
    // If dealstage is empty string, exclude it from update to preserve original value
    if (propertiesToUpdate.dealstage === "") {
      delete propertiesToUpdate.dealstage;
    }
  }

  try {
    const updatedDeal = await hubspotClient.crm.deals.basicApi.update(dealId, {
      properties: propertiesToUpdate,
    });
    return NextResponse.json(updatedDeal);
  } catch (error: unknown) {
    console.error(`Error updating deal ${dealId}:`, error);
    let errorMessage = "Failed to update deal.";
    let statusCode = 500;

    if (isHubSpotApiError(error)) {
      if (error.response?.statusCode === 404) {
        errorMessage = error.response?.body?.message || "Deal not found.";
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
