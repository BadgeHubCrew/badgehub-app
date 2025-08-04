import { z } from "zod/v3";

export const isoDateStringSchema = z.string().endsWith("Z");

export type ISODateString = string; // TODO change to `${string}.${number}Z`; Requires zod/v4
