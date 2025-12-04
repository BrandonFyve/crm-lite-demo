import { z } from "zod";
import { DEAL_PROPERTIES } from "@/lib/hubspot-deals";

const stringProperties = DEAL_PROPERTIES.reduce<Record<string, z.ZodTypeAny>>((acc, property) => {
  acc[property] = z.string().optional();
  return acc;
}, {});

export const dealUpdateSchema = z.object(stringProperties).partial().refine((data) => {
  return Object.keys(data).length > 0;
}, {
  message: "Request body must include at least one deal property",
});

export type DealUpdatePayload = z.infer<typeof dealUpdateSchema>;

