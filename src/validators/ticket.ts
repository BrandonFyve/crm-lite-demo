import { z } from "zod";

export const ticketIdParamsSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
});

const stagePattern = /^[0-9a-z_-]+$/i;

export const ticketStageUpdateSchema = z.object({
  hs_pipeline_stage: z
    .string()
    .min(1, "hs_pipeline_stage is required")
    .regex(stagePattern, "hs_pipeline_stage must be an alphanumeric stage identifier"),
});

export type TicketStageUpdatePayload = z.infer<typeof ticketStageUpdateSchema>;

