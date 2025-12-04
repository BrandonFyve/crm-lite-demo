import { Client } from "@hubspot/api-client";
import { z } from "zod";

const envSchema = z
  .object({
    HUBSPOT_API_KEY: z.string().optional(),
    HUBSPOT_TEST_API_KEY: z.string().optional(),
  })
  .refine(
    ({ HUBSPOT_API_KEY, HUBSPOT_TEST_API_KEY }) =>
      Boolean(HUBSPOT_API_KEY || HUBSPOT_TEST_API_KEY),
    {
      message:
        "HUBSPOT_API_KEY is required (or HUBSPOT_TEST_API_KEY for automated tests).",
    },
  );

const env = envSchema.safeParse(process.env);

if (!env.success) {
  throw new Error(env.error.errors[0]?.message ?? "HUBSPOT_API_KEY is required.");
}

const accessToken = env.data.HUBSPOT_API_KEY ?? env.data.HUBSPOT_TEST_API_KEY!;

export const hubspotClient = new Client({
  accessToken,
});

export function getHubSpotAccessToken(): string {
  return accessToken;
}
