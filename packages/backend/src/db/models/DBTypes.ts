import type { ISODateString } from "@badgehub/shared/domain/readModels/ISODateString";

export type TimestampTZ =
  | `${number}-${number}-${number} ${number}:${number}:${number}.${number} +${number}`
  | ISODateString;
