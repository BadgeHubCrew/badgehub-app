import type { BadgeSlug } from "@shared/domain/readModels/Badge";
import {
  type ISODateString,
  isoDateStringSchema,
} from "@shared/domain/readModels/ISODateString";
import {
  type CategoryName,
  categoryNameSchema,
} from "@shared/domain/readModels/project/Category";
import {
  type ProjectCore,
  projectCoreSchema,
} from "@shared/domain/readModels/project/ProjectDetails";
import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import { z } from "zod";

export interface ProjectSummary extends ProjectCore {
  // Computed
  hidden?: boolean;
  name: string;
  published_at?: ISODateString; // Can be undefined if not published yet
  blur_hash?: string; // see https://github.com/woltapp/blurhash
  icon_map?: IconMapWithUrls; // Relative path to the icon of the project
  installs: number;
  // ratings: { average: number; count: number } | null; // Average rating and count of ratings
  license_type?: string; // Eg. MIT
  categories?: CategoryName[];
  badges?: Array<BadgeSlug>;
  description?: string; // description in metadata of latest version of the projectct
  version?: string; // semantic version in metadata of latest version of the project
  revision: number; // latest revision number of the project
  git_url?: string;
}

const fullPathAndUrlSchema = z.object({
  full_path: z.string(),
  url: z.string().url(),
});

export const iconMapWithUrlsSchema = z
  .object({
    "8x8": fullPathAndUrlSchema.optional(),
    "16x16": fullPathAndUrlSchema.optional(),
    "32x32": fullPathAndUrlSchema.optional(),
    "64x64": fullPathAndUrlSchema.optional(),
  })
  .describe(
    `Icon Map of the project that maps from accepted sizes to a file path and url.`
  );
export const projectSummarySchema = projectCoreSchema.extend({
  name: z.string(),
  hidden: z.boolean().optional(),
  published_at: isoDateStringSchema.optional(),
  blur_hash: z
    .string()
    .optional()
    .describe(
      "A BlurHash of the icon, allowing for quickly showing something while icons are downloading. See https://github.com/woltapp/blurhash for more info."
    ),
  installs: z
    .number()
    .describe(
      "The number of badges that have reported to have installed this app at least once."
    ),
  icon_map: iconMapWithUrlsSchema.optional(),
  license_type: z.string().optional(),
  categories: z.array(categoryNameSchema).optional(),
  badges: z.array(z.string()).optional(), // Array of BadgeSlugs
  description: z.string().optional(),
  version: z.string().optional(),
  revision: z.number(),
  git_url: z.string().optional(),
});

/** Stable array schema so OpenAPI can $ref the list response. */
export const projectSummariesSchema = z.array(projectSummarySchema);
export type FullPathAndUrl = {
  full_path: string;
  url: string;
};
export type IconMapWithUrls = {
  "8x8"?: FullPathAndUrl;
  "16x16"?: FullPathAndUrl;
  "32x32"?: FullPathAndUrl;
  "64x64"?: FullPathAndUrl;
};

__tsCheckSame<
  ProjectSummary,
  ProjectSummary,
  z.infer<typeof projectSummarySchema>
>(true);
