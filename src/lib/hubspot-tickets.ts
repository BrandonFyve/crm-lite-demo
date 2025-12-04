import { hubspotClient } from "./hubspot";
import { z } from "zod";
import {
  FilterGroup,
  Filter,
  FilterOperatorEnum,
} from "@hubspot/api-client/lib/codegen/crm/tickets";

export const TICKET_PROPERTIES = [
  "subject",
  "content",
  "hs_pipeline_stage",
  "hs_ticket_priority",
  "createdate",
  "hubspot_owner_id",
];

const TicketStageSchema = z.object({
  id: z.string(),
  label: z.string(),
  displayOrder: z.number().optional(),
});

const TicketStageResponseSchema = TicketStageSchema.array();

export async function getTicketStages() {
  try {
    const response = await hubspotClient.crm.pipelines.pipelinesApi.getAll(
      "ticket",
    );
    const pipeline = response.results?.[0];

    if (!pipeline?.stages?.length) {
      return [];
    }

    return TicketStageResponseSchema.parse(pipeline.stages);
  } catch (error) {
    console.error("Error fetching ticket stages from HubSpot:", error);
    return [];
  }
}

const TicketSearchResultSchema = z
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
  .transform((data) => data.results);

export async function searchTickets({
  ownerId,
  limit = 100,
  sorts = ["-createdate"],
}: {
  ownerId?: string | null;
  limit?: number;
  sorts?: string[];
}) {
  const filterGroups: FilterGroup[] = [];

  if (ownerId) {
    const ownerFilter: Filter = {
      propertyName: "hubspot_owner_id",
      operator: FilterOperatorEnum.Eq,
      value: ownerId,
    };
    const ownerFilterGroup: FilterGroup = {
      filters: [ownerFilter],
    };
    filterGroups.push(ownerFilterGroup);
  }

  const request = {
    filterGroups,
    properties: [...TICKET_PROPERTIES],
    limit,
    sorts,
  };
  const response = await hubspotClient.crm.tickets.searchApi.doSearch(request);

  return TicketSearchResultSchema.parse(response).map((result) => ({
    ...result,
    properties: Object.fromEntries(
      Object.entries(result.properties).map(([key, value]) => [
        key === "createdate" ? "createdAt" : key,
        value ?? "",
      ])
    ),
  }));
}

const OwnerSchema = z.object({
  id: z.union([z.string(), z.number()]),
  email: z.string().nullish(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  archived: z.boolean().nullish(),
});

const OwnerResponseSchema = z
  .object({
    results: OwnerSchema.array().default([]),
  })
  .transform((data) => data.results);

export async function getOwners() {
  const response = await hubspotClient.crm.owners.ownersApi.getPage();
  const owners = OwnerResponseSchema.parse(response);

  return owners.map((owner) => ({
    id: String(owner.id),
    email: owner.email ?? undefined,
    firstName: owner.firstName ?? undefined,
    lastName: owner.lastName ?? undefined,
    archived: owner.archived ?? undefined,
  }));
}

