import { datedDataSchema } from "./DatedData.ts";
import type { DatedData } from "./DatedData.ts";
import { z } from "zod/v3";
import { __tsCheckSame } from "@badgehub/shared/zodUtils/zodTypeComparison";

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
