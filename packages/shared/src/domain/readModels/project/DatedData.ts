import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import { z } from "zod/v3";
import {
  ISODateString,
  isoDateStringSchema,
} from "@shared/domain/readModels/ISODateString";

export interface DatedData {
  created_at: ISODateString; // Creation date
  updated_at: ISODateString; // Last update date
}

export const datedDataSchema = z.object({
  created_at: isoDateStringSchema,
  updated_at: isoDateStringSchema,
});

__tsCheckSame<DatedData, DatedData, z.infer<typeof datedDataSchema>>(true);
