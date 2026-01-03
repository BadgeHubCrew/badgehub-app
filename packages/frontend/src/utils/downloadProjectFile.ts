import Keycloak from "keycloak-js";
import { FileMetadata } from "@shared/domain/readModels/project/FileMetadata.ts";
import { assertDefined } from "@shared/util/assertions.ts";
import { getFreshAuthorizedTsRestClient } from "@api/tsRestClient.ts";
import { extractFilename } from "@utils/fileUtils.ts";

export async function downloadProjectFile(
  keycloak: Keycloak,
  slug: string,
  file: FileMetadata
) {
  try {
    assertDefined(keycloak);
    const client = await getFreshAuthorizedTsRestClient(keycloak);
    const response = await client.getDraftFile({
      params: { slug, filePath: file.full_path },
    });

    if (response.status === 200 && response.body) {
      // Create a download link
      const url = window.URL.createObjectURL(response.body as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = extractFilename(file.full_path);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Failed to download file:", error);
  }
}
