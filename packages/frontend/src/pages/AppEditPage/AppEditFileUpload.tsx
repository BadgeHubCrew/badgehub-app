import React, { useState } from "react";
import {
  getFreshAuthorizedTsRestClient,
  publicTsRestClient as defaultTsRestClient,
} from "../../api/tsRestClient.ts";
import Keycloak from "keycloak-js";
import { assertDefined } from "@shared/util/assertions.ts";
import { isExecutableFileName } from "@utils/fileUtils.ts";

const AppEditFileUpload: React.FC<{
  slug: string;
  tsRestClient?: typeof defaultTsRestClient;
  onUploadSuccess: (result: {
    metadataChanged?: boolean;
    firstValidExecutable?: string | null;
  }) => void;
  keycloak?: Keycloak | undefined;
}> = ({ slug, onUploadSuccess, keycloak }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    assertDefined(keycloak);
    setError(null);
    setSuccess(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    let appMetadataChanged = false;
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await (
          await getFreshAuthorizedTsRestClient(keycloak)
        ).writeDraftFile({
          params: { slug, filePath: file.name },
          body: formData,
        });
        if (res.status !== 204) {
          throw new Error(`Upload failed for ${file.name}`);
        }
        if (file.name === "metadata.json") {
          appMetadataChanged = true;
        }
      }
      setSuccess("File(s) uploaded successfully.");

      const firstValidFile = Array.from(files).find((f) =>
        isExecutableFileName(f.name)
      );
      onUploadSuccess({
        metadataChanged: appMetadataChanged,
        firstValidExecutable: firstValidFile ? firstValidFile.name : null,
      });
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to upload file(s)."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <section className="card bg-base-200 shadow-lg">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-2">Files</h2>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Upload Files</span>
          </label>
          <input
            type="file"
            name="file-upload"
            data-testid="app-edit-file-upload-input"
            className="file-input file-input-bordered w-full"
            multiple
            disabled={uploading}
            onChange={handleFileChange}
          />
          <label className="label">
            <span className="label-text-alt whitespace-normal break-words">
              You can upload any file type (e.g., code, images, docs). Executable
              file types will be selectable as "Main".
            </span>
          </label>
          {uploading && (
            <p className="text-xs text-success mt-2">Uploading...</p>
          )}
          {error && <p className="text-xs text-error mt-2">{error}</p>}
          {success && <p className="text-xs text-success mt-2">{success}</p>}
        </div>
      </div>
    </section>
  );
};

export default AppEditFileUpload;
