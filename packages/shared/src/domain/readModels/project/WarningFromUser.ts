import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import { z } from "zod";
import { type DatedData, datedDataSchema } from "./DatedData";
import { type UserRelation, userSchema } from "./User";

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
