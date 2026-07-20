import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import { z } from "zod";

export const isoDateStringSchema = z
  .templateLiteral([z.string(), ".", z.int(), "Z"])
  .meta({ examples: ["2024-08-10T14:48:00.000Z"] });

export type ISODateString = `${string}.${number}Z`;

__tsCheckSame<
  ISODateString,
  ISODateString,
  z.infer<typeof isoDateStringSchema>
>;
