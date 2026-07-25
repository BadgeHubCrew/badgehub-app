import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import { z } from "zod";
import { type DatedData, datedDataSchema } from "./DatedData";

export interface UserRelation {
  user: User;
}

export const roleSchema = z.enum(["admin"]);
export type Role = z.infer<typeof roleSchema>;

export interface User extends DatedData {
  idp_user_id: string;
  roles: Role[];
}

export const userSchema = datedDataSchema.extend({
  idp_user_id: z.string(),
  roles: z.array(roleSchema),
});

__tsCheckSame<User, User, z.infer<typeof userSchema>>(true);

/** Request-scoped user identity (no dated fields from JWT). */
export type UserIdentity = Pick<User, "idp_user_id" | "roles">;

export function userHasRole(
  user: Pick<User, "roles"> | undefined,
  role: Role
): boolean {
  return user?.roles.includes(role) ?? false;
}

export function isAdminUser(user: Pick<User, "roles"> | undefined): boolean {
  return userHasRole(user, "admin");
}
