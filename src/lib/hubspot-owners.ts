import { hubspotClient } from "./hubspot";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { withRetry } from "./rate-limit";

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

export type OwnerSummary = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  archived?: boolean;
};

// Wrapped API call with retry logic
const getOwnersPageWithRetry = withRetry(
  async () => {
    return await hubspotClient.crm.owners.ownersApi.getPage();
  },
  "get-owners-page"
);

// Helper function to validate email format
function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return true; // Email is optional
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const getOwners = unstable_cache(
  async (): Promise<OwnerSummary[]> => {
    try {
      const response = await getOwnersPageWithRetry();
      const owners = OwnerResponseSchema.parse(response);

      // Filter and map owners, removing invalid ones
      const validOwners = owners
        .map((owner) => {
          const id = String(owner.id);
          // Filter out owners with empty IDs
          if (!id || id.trim().length === 0) {
            console.warn("Skipping owner with empty ID:", owner);
            return null;
          }

          const email = owner.email ?? undefined;
          // Filter out owners with invalid email format (if email is provided)
          if (email && !isValidEmail(email)) {
            console.warn(`Skipping owner ${id} with invalid email: ${email}`);
            return null;
          }

          return {
            id,
            email,
            firstName: owner.firstName ?? undefined,
            lastName: owner.lastName ?? undefined,
            archived: owner.archived ?? undefined,
          };
        })
        .filter((owner): owner is OwnerSummary => owner !== null);

      return validOwners;
    } catch (error) {
      console.error("Error fetching HubSpot owners:", error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      return [];
    }
  },
  ["hubspot-owners"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["hubspot-owners"],
  }
);

export async function findOwnerIdByEmail(email: string) {
  const owners = await getOwners();
  const owner = owners.find((o) => o.email?.toLowerCase() === email.toLowerCase());
  return owner?.id ?? null;
}

