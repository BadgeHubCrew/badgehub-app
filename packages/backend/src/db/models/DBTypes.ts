import type { ISODateString } from "#shared/domain/readModels/ISODateString";

export type TimestampTZ =
  | `${number}-${number}-${number} ${number}:${number}:${number}.${number} +${number}`
  | ISODateString;
