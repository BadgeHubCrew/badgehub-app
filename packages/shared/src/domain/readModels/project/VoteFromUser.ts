import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import { z } from "zod";
import { type DatedData, datedDataSchema } from "./DatedData";
import { type UserRelation, userSchema } from "./User";

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
