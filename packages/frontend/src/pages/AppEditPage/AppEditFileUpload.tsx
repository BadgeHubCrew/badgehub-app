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
    <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-slate-100 mb-4">Files</h2>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Upload Files
        </label>
        <input
          type="file"
          name="file-upload"
          data-testid="app-edit-file-upload-input"
          className="form-input w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          multiple
          disabled={uploading}
          onChange={handleFileChange}
        />
        <p className="text-xs text-slate-500 mt-1">
          You can upload any file type (e.g., code, images, docs). Executable
          file types will be selectable as "Main".
        </p>
        {uploading && (
          <p className="text-xs text-emerald-400 mt-2">Uploading...</p>
        )}
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        {success && <p className="text-xs text-emerald-400 mt-2">{success}</p>}
      </div>
    </section>
  );
};

export default AppEditFileUpload;
