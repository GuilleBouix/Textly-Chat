import { z } from "zod";

export const improveSchema = z.object({
  action: z.enum(["improve", "translate"]),
  text: z.string().trim().min(1).max(1500),
});

export const usersMetaSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
});

export type ImproveInput = z.infer<typeof improveSchema>;
export type UsersMetaInput = z.infer<typeof usersMetaSchema>;
