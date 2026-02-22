import type { DBDatedData } from "#db/models/project/DBDatedData";
import type { DBSoftDeletable } from "#db/models/project/DBDatedData";
import type { DatedData } from "@badgehub/shared/domain/readModels/project/DatedData";
import moment from "moment";
import type { ISODateString } from "@badgehub/shared/domain/readModels/ISODateString";

export function extractDatedDataConverted(dbDatedData: DBDatedData): DatedData {
  const datedData: DatedData = {
    created_at: timestampTZToISODateString(dbDatedData.created_at),
    updated_at: timestampTZToISODateString(dbDatedData.updated_at),
  };
  return datedData;
}

type DateIfPossible<T extends string | undefined | null> = T extends undefined
  ? undefined
  : T extends null
    ? null
    : Date;

type ISODateStringIfPossible<T extends string | undefined | null> =
  T extends undefined ? undefined : T extends null ? null : ISODateString;

export function timestampTZToDate<T extends string | undefined | null>(
  dbDate: T
): DateIfPossible<T> {
  return (
    dbDate === undefined
      ? undefined
      : dbDate === null
        ? null
        : moment(dbDate).toDate()
  ) as DateIfPossible<T>;
}

export function timestampTZToISODateString<T extends string | undefined | null>(
  dbDate: T
): ISODateStringIfPossible<T> {
  return timestampTZToDate(dbDate)?.toISOString() as ISODateStringIfPossible<T>;
}

export type OmitDatedData<
  T extends (DBDatedData | DatedData) & DBSoftDeletable,
> = Omit<T, keyof DBDatedData | keyof DBSoftDeletable>;

export function convertDatedData<T extends DBDatedData>(
  datedData: T
): OmitDatedData<T> & DatedData {
  return {
    ...stripDatedData(datedData),
    ...extractDatedDataConverted(datedData),
  };
}

export function stripDatedData<
  T extends (DBDatedData | DatedData) & DBSoftDeletable,
>(datedData: T): OmitDatedData<T> {
  const { deleted_at, updated_at, created_at, ...dataWithoutDatedData } =
    datedData;
  return dataWithoutDatedData;
}
