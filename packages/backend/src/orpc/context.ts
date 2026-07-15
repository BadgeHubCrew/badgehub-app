import type { UserDataInRequest } from "@auth/jwt-decode";
import type { BadgeHubData } from "@domain/BadgeHubData";

export type AuthContext = {
  user?: UserDataInRequest;
  apiToken?: string;
  headers: Headers;
};

export type AppContext = AuthContext & {
  badgeHubData: BadgeHubData;
};
