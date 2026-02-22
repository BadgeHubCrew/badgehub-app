import { __tsCheckSame } from "@badgehub/shared/zodUtils/zodTypeComparison";
import { datedDataSchema } from "./DatedData.ts";
import type { DatedData } from "./DatedData.ts";
import { z } from "zod/v3";

export interface FileMetadata extends DatedData {
  dir: string; // directory of the file in the project, empty string if top level
  name: string; // file name without extension
  ext: string; // file extension
  mimetype: string; // Can include info about the programming language
  image_width?: number;
  image_height?: number;
  size_of_content: number;
  sha256: string; // lowercase hex sha256 digest, allows verifying whether content is the same as other file.
  // Computed
  size_formatted: string; // Human readable size_of_content
  full_path: string; // full path of file with filename and extensions (dir+'/'+name+'.'+ext)
  url: string;
}

export const fileMetadataSchema = datedDataSchema.extend({
  dir: z.string(),
  name: z.string(),
  ext: z.string(),
  mimetype: z.string(),
  image_width: z.number().optional(),
  image_height: z.number().optional(),
  size_of_content: z.number(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/), // Lowercase hex sha256 digest
  size_formatted: z.string(), // Human readable size_of_content
  full_path: z.string(), // full path of file with filename and extensions (dir+'/'+name+'.'+ext)
  url: z
    .string()
    .url()
    .describe("Url that should be used to download the file"),
});

__tsCheckSame<FileMetadata, FileMetadata, z.infer<typeof fileMetadataSchema>>(
  true
);
