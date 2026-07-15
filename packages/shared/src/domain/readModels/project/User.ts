import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import { z } from "zod";
import { type DatedData, datedDataSchema } from "./DatedData";

export interface UserRelation {
  user: User;
}

export interface User extends DatedData {
  idp_user_id: string;
}

export const userSchema = datedDataSchema.extend({
  idp_user_id: z.string(),
});

__tsCheckSame<User, User, z.infer<typeof userSchema>>(true);
