import { z } from "zod/v3";
import { __tsCheckSame } from "@badgehub/shared/zodUtils/zodTypeComparison";
import { badgeSlugSchema } from "@badgehub/shared/domain/readModels/Badge";
import type { BadgeSlug } from "@badgehub/shared/domain/readModels/Badge";

export const variantJSONSchema = z.object({
  revision: z.coerce.number().int().nonnegative().optional()
    .describe(`Revision of the project for this variant. If it is not present, then the revision of the project should be used.
Warning: if it is present, then badgehub clients on badges will not update the app unless the this revision number is increased.`),
  type: z
    .string()
    .optional()
    .describe(
      "the type of the application variant, eg 'standalone', 'badge_vms', 'appfs', 'micropython', 'circuitpython', ..."
    ), // Only useful for projects with project_type "application".
  executable: z
    .string()
    .optional()
    .describe(
      `Path to the source_file path of the file that should be executed to launch an app.
If the executable property is not present, then it can be guessed by the badge firmware (eg. case of only one file with correct extension, or case of __init__.py file in micropython app.`
    ),
  args: z.array(z.string()).optional(),
  assets: z
    .array(
      z.object({
        source_file: z
          .string()
          .describe("Path to the source file, relative to the project root"),
        destination_file: z
          .string()
          .optional()
          .describe("Path to the destination file in the badge's filesystem"),
      })
    )
    .optional()
    .describe(`List of assets that are part of the variant, with optionally an indication of how the files should be mapped on the badge. 
if the assets property is not present, then all project files should be considered part of the variant.`),
  badges: z
    .array(badgeSlugSchema)
    .optional()
    .describe(
      "list of badges that that this variant is made for. This should be subset of the badges in the top level appmetadata.json and it should not overlap with any other variants."
    ),
});

type AssetEntry = {
  source_file: string;
  destination_file?: string;
};

export type VariantJSON = {
  revision?: number;
  type?: string;
  executable?: string;
  args?: string[];
  assets?: AssetEntry[];
  badges?: BadgeSlug[];
};

__tsCheckSame<VariantJSON, VariantJSON, z.infer<typeof variantJSONSchema>>(
  true
);
