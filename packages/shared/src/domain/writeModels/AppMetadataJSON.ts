import { appMetadataJSONSchema } from "#shared/domain/readModels/project/AppMetadataJSON";
import type { AppMetadataJSON } from "#shared/domain/readModels/project/AppMetadataJSON";

export type WriteAppMetadataJSON = AppMetadataJSON;
export const writeAppMetadataJSONSchema = appMetadataJSONSchema;
