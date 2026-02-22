import { userSchema } from "./User.ts";
import type { UserRelation } from "./User.ts";
import { datedDataSchema } from "./DatedData.ts";
import type { DatedData } from "./DatedData.ts";
import { z } from "zod/v3";
import { __tsCheckSame } from "@badgehub/shared/zodUtils/zodTypeComparison";

export interface Warning {
  description: string;
}

export interface WarningFromUser extends Warning, UserRelation, DatedData {}

export const warningFromUserSchema = datedDataSchema.extend({
  description: z.string(),
  user: userSchema,
});

__tsCheckSame<
  WarningFromUser,
  WarningFromUser,
  z.infer<typeof warningFromUserSchema>
>(true);
