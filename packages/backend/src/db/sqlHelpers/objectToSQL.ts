import { getEntriesWithDefinedValues } from "@badgehub/shared/util/objectEntries";
import { join, raw } from "sql-template-tag";

const COLUMN_KEY_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function assertValidColumKey(key: string): string {
  if (!COLUMN_KEY_REGEX.test(key)) {
    throw new Error("Invalid column key: " + key);
  }
  return key;
}

export function getInsertKeysAndValuesSql(user: Object) {
  const definedEntries = getEntriesWithDefinedValues(user);
  const keys = join(
    definedEntries.map(([key]) => raw(assertValidColumKey(key)))
  );
  const values = join(definedEntries.map(([, value]) => value));
  return { keys, values };
}
