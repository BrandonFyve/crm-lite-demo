import { z } from "zod";

export const noteParamsSchema = z.object({
  dealId: z.string().min(1, "Deal ID is required"),
});

export const noteCreateSchema = z.object({
  noteBody: z
    .string({ required_error: "Note body is required" })
    .trim()
    .min(1, "Note body is required and cannot be empty"),
});

export type NoteCreatePayload = z.infer<typeof noteCreateSchema>;

