import { appMetadataJSONSchema } from "@badgehub/shared/domain/readModels/project/AppMetadataJSON";
import type { AppMetadataJSON } from "@badgehub/shared/domain/readModels/project/AppMetadataJSON";

export type WriteAppMetadataJSON = AppMetadataJSON;
export const writeAppMetadataJSONSchema = appMetadataJSONSchema;
