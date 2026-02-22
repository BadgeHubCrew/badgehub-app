import { z } from "zod/v3";
import { __tsCheckSame } from "@badgehub/shared/zodUtils/zodTypeComparison";

export const badgeHubStatsSchema = z.object({
  projects: z.number().describe("number of projects"),
  installs: z.number(),
  crashes: z.number(),
  launches: z.number(),
  installed_projects: z.number(),
  launched_projects: z.number(),
  crashed_projects: z.number(),
  authors: z.number().describe("number of project authors"),
  badges: z.number().describe("Number of registered badges"),
});

export type BadgeHubStats = {
  projects: number;
  installs: number;
  crashes: number;
  launches: number;
  installed_projects: number;
  launched_projects: number;
  crashed_projects: number;
  authors: number;
  badges: number;
};

__tsCheckSame<
  BadgeHubStats,
  BadgeHubStats,
  z.infer<typeof badgeHubStatsSchema>
>(true);
