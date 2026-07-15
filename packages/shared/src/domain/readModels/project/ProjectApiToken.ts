import {
  type ISODateString,
  isoDateStringSchema,
} from "@shared/domain/readModels/ISODateString";
import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import { z } from "zod";

export type ProjectApiTokenMetadata = {
  created_at: ISODateString;
  last_used_at: ISODateString;
};

export const projectApiTokenMetadataSchema = z
  .object({
    created_at: isoDateStringSchema,
    last_used_at: isoDateStringSchema,
  })
  .describe(`Metadata about the token.`);

__tsCheckSame<
  ProjectApiTokenMetadata,
  ProjectApiTokenMetadata,
  z.infer<typeof projectApiTokenMetadataSchema>
>(true);
