import { hubspotClient } from "./hubspot";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { withRetry } from "./rate-limit";
import {
  FilterGroup,
  Filter,
  FilterOperatorEnum,
} from "@hubspot/api-client/lib/codegen/crm/deals";

export const DEAL_PROPERTIES = [
  // Core default HubSpot deal properties only
  "dealname",
  "amount",
  "closedate",
  "dealstage",
  "hubspot_owner_id",
  "createdate",
  "notes",
  "pipeline", // Pipeline ID for filtering
];

const DealStageSchema = z.object({
  id: z.string(),
  label: z.string(),
  displayOrder: z.number().nonnegative(),
  probability: z.number().min(0).max(1),
});

export type DealStage = z.infer<typeof DealStageSchema>;

const DealStageResponseSchema = DealStageSchema.array();

export interface Pipeline {
  id: string;
  label: string;
  stages: DealStage[];
}

const FALLBACK_DEAL_STAGES = [
  {
    id: "appointmentscheduled",
    label: "Appointment Scheduled",
    displayOrder: 0,
    probability: 0.2,
  },
  {
    id: "qualifiedtobuy",
    label: "Qualified To Buy",
    displayOrder: 1,
    probability: 0.4,
  },
  {
    id: "presentationscheduled",
    label: "Presentation Scheduled",
    displayOrder: 2,
    probability: 0.6,
  },
  {
    id: "decisionmakerboughtin",
    label: "Decision Maker Bought-In",
    displayOrder: 3,
    probability: 0.8,
  },
  {
    id: "contractsent",
    label: "Contract Sent",
    displayOrder: 4,
    probability: 0.9,
  },
  {
    id: "closedwon",
    label: "Closed Won",
    displayOrder: 5,
    probability: 1,
  },
  {
    id: "closedlost",
    label: "Closed Lost",
    displayOrder: 6,
    probability: 0,
  },
] satisfies z.infer<typeof DealStageResponseSchema>;

// Wrapped API call with retry logic
const getAllPipelinesWithRetry = withRetry(
  async () => {
    return await hubspotClient.crm.pipelines.pipelinesApi.getAll("deals");
  },
  "get-all-pipelines"
);

export const getDealStages = unstable_cache(
  async () => {
    try {
      const pipelinesResponse = await getAllPipelinesWithRetry();

      const pipeline = pipelinesResponse.results?.[0];

      if (!pipeline?.stages?.length) {
        console.warn(
          "No pipeline stages found in HubSpot, using fallback stages. " +
            "Note: Fallback stage IDs may not match actual deal stage IDs in HubSpot."
        );
        return FALLBACK_DEAL_STAGES;
      }

      const stages = pipeline.stages
        .map((stage, index) => ({
          id: stage.id,
          label: stage.label,
          displayOrder: stage.displayOrder ?? index,
          probability: stage.metadata?.probability
            ? Number(stage.metadata.probability) / 100
            : 0,
        }))
        .sort((a, b) => a.displayOrder - b.displayOrder);

      return DealStageResponseSchema.parse(stages);
    } catch (error) {
      console.error(
        "Error fetching deal stages from HubSpot, using fallback stages:",
        error
      );
      console.warn(
        "Fallback stage IDs may not match actual deal stage IDs in HubSpot. " +
          "Deals with mismatched stage IDs may not display correctly."
      );
      return FALLBACK_DEAL_STAGES;
    }
  },
  ["deal-stages"],
  {
    revalidate: 300, // Cache for 5 minutes (reduced for better Vercel compatibility)
    tags: ["hubspot-stages"],
  }
);

const DealSearchResponseSchema = z
  .object({
    results: z.array(
      z.object({
        id: z.string(),
        properties: z.record(z.string(), z.string().nullish()).default({}),
        createdAt: z
          .union([z.string(), z.date()])
          .optional()
          .transform((val) => (val ? new Date(val) : new Date(0))),
        updatedAt: z
          .union([z.string(), z.date()])
          .optional()
          .transform((val) => (val ? new Date(val) : new Date(0))),
      })
    ),
  })
  .transform(({ results }) => results);

export const getCachedDeals = unstable_cache(
  async ({
    limit = 100,
    sorts = ["-closedate"],
    pipelineId,
  }: {
    limit?: number;
    sorts?: string[];
    pipelineId?: string;
  } = {}) => {
    return await searchDeals({ limit, sorts, pipelineId });
  },
  ["deals-search"],
  {
    revalidate: 300,
    tags: ["hubspot-deals"],
  }
);

// Wrapped search API call with retry logic
const doSearchWithRetry = withRetry(
  async (request: unknown) => {
    return await hubspotClient.crm.deals.searchApi.doSearch(
      request as Parameters<typeof hubspotClient.crm.deals.searchApi.doSearch>[0]
    );
  },
  "search-deals"
);

// Allowed pipeline IDs for deal filtering
export const ALLOWED_PIPELINE_IDS = ["859017476", "859172223", "859283831"];

export const getTargetPipelines = unstable_cache(
  async (): Promise<Pipeline[]> => {
    try {
      const pipelinesResponse = await getAllPipelinesWithRetry();
      const targetIds = new Set(ALLOWED_PIPELINE_IDS);

      const pipelines = pipelinesResponse.results
        ?.filter((p) => targetIds.has(p.id))
        .map((pipeline) => ({
          id: pipeline.id,
          label: pipeline.label,
          stages: (pipeline.stages || [])
            .map((stage, index) => ({
              id: stage.id,
              label: stage.label,
              displayOrder: stage.displayOrder ?? index,
              probability: stage.metadata?.probability
                ? Number(stage.metadata.probability) / 100
                : 0,
            }))
            .sort((a, b) => a.displayOrder - b.displayOrder),
        })) ?? [];

      return pipelines;
    } catch (error) {
      console.error("Error fetching target pipelines:", error);
      return [];
    }
  },
  ["target-pipelines"],
  {
    revalidate: 300,
    tags: ["hubspot-pipelines"],
  }
);

export async function searchDeals({
  limit = 100,
  sorts = ["-closedate"],
  pipelineId,
}: {
  limit?: number;
  sorts?: string[];
  pipelineId?: string;
}) {
  const allResults: z.infer<typeof DealSearchResponseSchema> = [];
  let after: string | undefined;

  // If specific pipeline requested, filter to just that one
  // Otherwise, filter to all allowed pipelines
  const pipelineIds = pipelineId ? [pipelineId] : ALLOWED_PIPELINE_IDS;

  // Create filterGroups for OR logic between pipelines
  // Each filterGroup uses EQ operator for one pipeline ID
  // Multiple filterGroups create OR condition (pipeline A OR pipeline B OR pipeline C)
  const filterGroups: FilterGroup[] = pipelineIds.map((id) => ({
    filters: [
      {
        propertyName: "pipeline",
        operator: FilterOperatorEnum.Eq,
        value: id,
      },
    ],
  }));

  do {
    const request = {
      filterGroups: filterGroups,
      properties: [...DEAL_PROPERTIES],
      limit,
      sorts,
      after,
    };

    const response = await doSearchWithRetry(request);
    const results = DealSearchResponseSchema.parse(response);

    allResults.push(...results);
    after = response.paging?.next?.after;
  } while (after);

  return allResults.map((result) => ({
    ...result,
    properties: Object.fromEntries(
      Object.entries(result.properties).map(([key, value]) => [
        key === "createdate" ? "createdAt" : key,
        value ?? "",
      ])
    ),
  }));
}

export interface ExportStartResponse {
  id: string;
  statusUrl: string;
}

export interface ExportStatusResponse {
  status: "IN_PROGRESS" | "COMPLETE" | "FAILED";
  result?: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Starts a deal export in HubSpot
 * @returns Export ID and status URL
 */
export async function startDealExport(): Promise<ExportStartResponse> {
  const { getHubSpotAccessToken } = await import("./hubspot");
  const accessToken = getHubSpotAccessToken();

  const exportName = `deals-export-${Date.now()}`;
  const requestBody = {
    exportType: "VIEW",
    format: "XLS",
    exportName,
    objectProperties: [...DEAL_PROPERTIES],
    objectType: "DEAL",
    language: "EN",
    exportInternalValuesOptions: ["NAMES"],
  };

  const response = await fetch("https://api.hubapi.com/crm/v3/exports/export/async", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to start export: ${errorData.message || response.statusText}`
    );
  }

  const data = await response.json();
  return {
    id: data.id,
    statusUrl: data.links?.status || `https://api.hubapi.com/crm/v3/exports/export/async/tasks/${data.id}/status`,
  };
}

/**
 * Checks the status of an export
 * @param exportId The export task ID
 * @returns Export status response
 */
export async function checkExportStatus(exportId: string): Promise<ExportStatusResponse> {
  const { getHubSpotAccessToken } = await import("./hubspot");
  const accessToken = getHubSpotAccessToken();

  const response = await fetch(
    `https://api.hubapi.com/crm/v3/exports/export/async/tasks/${exportId}/status`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to check export status: ${errorData.message || response.statusText}`
    );
  }

  return await response.json();
}

/**
 * Polls the export status until it completes or fails
 * @param exportId The export task ID
 * @returns Download URL when complete
 */
export async function pollExportUntilComplete(exportId: string): Promise<string> {
  const startTime = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes

  // Initial check immediately
  let status = await checkExportStatus(exportId);

  if (status.status === "COMPLETE") {
    if (!status.result) {
      throw new Error("Export completed but no download URL provided");
    }
    return status.result;
  }

  if (status.status === "FAILED") {
    throw new Error("Export failed");
  }

  // Wait 2 seconds before first poll
  await new Promise((resolve) => setTimeout(resolve, 2000));

  while (true) {
    if (Date.now() - startTime > timeout) {
      throw new Error("Export timed out after 5 minutes");
    }

    status = await checkExportStatus(exportId);

    if (status.status === "COMPLETE") {
      if (!status.result) {
        throw new Error("Export completed but no download URL provided");
      }
      return status.result;
    }

    if (status.status === "FAILED") {
      throw new Error("Export failed");
    }

    // Poll every 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}
