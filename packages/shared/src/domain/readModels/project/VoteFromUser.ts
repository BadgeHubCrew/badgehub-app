import { userSchema } from "./User.ts";
import type { UserRelation } from "./User.ts";
import { datedDataSchema } from "./DatedData.ts";
import type { DatedData } from "./DatedData.ts";
import { z } from "zod/v3";
import { __tsCheckSame } from "@badgehub/shared/zodUtils/zodTypeComparison";

export interface Vote {
  type: "up" | "down" | "pig";
  comment?: string;
}

export interface VoteFromUser extends Vote, UserRelation, DatedData {}

export const voteFromUserSchema = datedDataSchema.extend({
  type: z.enum(["up", "down", "pig"]),
  comment: z.string().optional(),
  user: userSchema,
});

__tsCheckSame<VoteFromUser, VoteFromUser, z.infer<typeof voteFromUserSchema>>(
  true
);
