import { z } from "zod";

export const ownerSchema = z.object({
  id: z.string().min(1),
  // Allow empty string or valid email, or undefined
  email: z
    .union([z.string().email(), z.literal(""), z.undefined()])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  archived: z.boolean().optional(),
});

export const ownersResponseSchema = z.array(ownerSchema);

export type OwnerResponse = z.infer<typeof ownersResponseSchema>;

