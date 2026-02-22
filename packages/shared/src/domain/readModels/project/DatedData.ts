import { __tsCheckSame } from "@badgehub/shared/zodUtils/zodTypeComparison";
import { z } from "zod/v3";
import { isoDateStringSchema } from "@badgehub/shared/domain/readModels/ISODateString";
import type { ISODateString } from "@badgehub/shared/domain/readModels/ISODateString";

export interface DatedData {
  created_at: ISODateString; // Creation date
  updated_at: ISODateString; // Last update date
}

export const datedDataSchema = z.object({
  created_at: isoDateStringSchema,
  updated_at: isoDateStringSchema,
});

__tsCheckSame<DatedData, DatedData, z.infer<typeof datedDataSchema>>(true);
