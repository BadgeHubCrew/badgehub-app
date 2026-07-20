import type { ISODateString } from "../domain/readModels/ISODateString";

declare global {
  interface Date {
    toISOString(): ISODateString;
  }
}
