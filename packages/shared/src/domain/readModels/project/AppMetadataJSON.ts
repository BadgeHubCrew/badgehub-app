// This represents the contents of the metadata.json file that we have in the project.
// This is only put into the database for making interesting read queries possible.
// These contents should never be updated directly, but instead the metadata.json file should be modified and then read out again in order to fill the fields here.
// Metadata for a published version cannot be edited, except by republishing this version which would overwrite the old version.
import { categoryNameSchema } from "@badgehub/shared/domain/readModels/project/Category";
import type { CategoryName } from "@badgehub/shared/domain/readModels/project/Category";

import { __tsCheckSame } from "@badgehub/shared/zodUtils/zodTypeComparison";
import { z } from "zod/v3";
import { badgeSlugSchema } from "@badgehub/shared/domain/readModels/Badge";
import type { BadgeSlug } from "@badgehub/shared/domain/readModels/Badge";
import { variantJSONSchema } from "@badgehub/shared/domain/readModels/project/VariantJSON";
import type { VariantJSON } from "@badgehub/shared/domain/readModels/project/VariantJSON";

export interface AppMetadataJSON {
  name?: string;
  project_type?: "app" | "library" | "firmware" | "other";
  hidden?: boolean;
  description?: string;
  git_url?: string;
  version?: string;
  categories?: CategoryName[];
  author?: string;
  icon_map?: IconMap;
  license_file?: string;
  license_type?: string;
  badges?: BadgeSlug[];
  application?: VariantJSON[];
}

export const iconMapSchema = z
  .object({
    "8x8": z.string().optional(),
    "16x16": z.string().optional(),
    "32x32": z.string().optional(),
    "64x64": z.string().optional(),
  })
  .describe(
    `Icon Map of the project that maps from accepted sizes to a file path. Icon format is quite strict because BadgeHub is the first user of these icons.
    Badge implementations can use these icons but they are not required to. For example if a badge's launcher an icon as an icon.py file, this file can still just be uploaded and the path could be indicated as custom property in the variant json.".`
  );
export type IconSize = keyof IconMap;

export type IconMap = {
  "8x8"?: string;
  "16x16"?: string;
  "32x32"?: string;
  "64x64"?: string;
};
__tsCheckSame<IconMap, IconMap, z.infer<typeof iconMapSchema>>(true);

const variantMapSchema = z
  .record(
    badgeSlugSchema,
    z.string().optional().describe("Path to the json file for this variant")
  )
  .describe(
    `Map from badge slug to variant information, allows knowing if a variant is updated and where to find the json file for it.
This is used to determine if a variant is updated and where to find the json file for it.
The variant with the highest revision number determines the latest revision of the project.`
  );

export type VariantMap = Record<BadgeSlug, string | undefined>;
__tsCheckSame<VariantMap, VariantMap, z.infer<typeof variantMapSchema>>(true);

export const appMetadataJSONSchema = z.object({
  project_type: z
    .enum(["app", "library", "firmware", "other"])
    .optional()
    .describe("Type of the project, eg. 'app' or 'library'"),
  git_url: z.string().optional(),
  hidden: z
    .boolean()
    .describe(
      "Whether the project should be hidden from the launcher and from discovery on BadgeHub. Note that this does not make it private, just harder to find."
    )
    .optional(),
  name: z
    .string()
    .optional()
    .describe("name, we need this to show in the launcher and on badgehub."),
  description: z
    .string()
    .optional()
    .describe(
      "Some more details about the app. Allows users to decide whether they want to install the app."
    ),
  categories: z
    .array(categoryNameSchema)
    .optional()
    .describe(
      "Categories that the app falls into, eg. 'Event Related'. Categories are defined by the specific badgehub instance's config."
    ),
  author: z.string().optional().describe("Name of the author of the project"),
  icon_map: iconMapSchema.optional(),
  license_file: z
    .string()
    .optional()
    .describe("Path to the License file. Default is LICENSE"),
  license_type: z
    .string()
    .optional()
    .describe("Short description of the license type, eg. 'MIT'"),
  version: z.string().optional().describe("Semantic version of the project"),
  badges: z
    .array(badgeSlugSchema)
    .optional()
    .describe("list of badges that are compatible with this project."),
  application: z
    .array(variantJSONSchema)
    .optional()
    .describe(
      "A list of application variants that allows specifying badge-specific properties of the project"
    ),
});

__tsCheckSame<
  AppMetadataJSON,
  AppMetadataJSON,
  z.infer<typeof appMetadataJSONSchema>
>(true);
