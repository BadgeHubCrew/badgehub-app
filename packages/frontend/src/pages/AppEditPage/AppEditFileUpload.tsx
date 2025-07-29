import React, { useState } from "react";
import { tsRestClient as defaultTsRestClient } from "../../api/tsRestClient.ts";
import Keycloak from "keycloak-js";
import { getAuthorizationHeader } from "@api/authorization.ts";

const AppEditFileUpload: React.FC<{
  slug: string;
  tsRestClient?: typeof defaultTsRestClient;
  onUploadSuccess: (result: {
    metadataChanged?: boolean;
    firstValidExecutable?: string | null;
  }) => void;
  keycloak?: Keycloak | undefined;
}> = ({
  slug,
  tsRestClient = defaultTsRestClient,
  onUploadSuccess,
  keycloak,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const excludedExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".md",
    ".txt",
    ".json",
  ];
  const isExecutable = (fileName: string) =>
    !excludedExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const res = await tsRestClient.writeDraftFile({
          headers: await getAuthorizationHeader(keycloak),
          params: { slug, filePath: file.name },
          body: formData,
        });
        if (file.name === "metadata.json") {
          appMetadataChanged = true;
        }
        if (res.status !== 204) {
          throw new Error(`Upload failed for ${file.name}`);
        }
      }
      setSuccess("File(s) uploaded successfully.");

      const firstValidFile = Array.from(files).find((f) =>
        isExecutable(f.name)
      );
      onUploadSuccess({
        metadataChanged: appMetadataChanged,
        firstValidExecutable: firstValidFile ? firstValidFile.name : null,
      });
    } catch (err: unknown) {
      console.error(err);
      if (appMetadataChanged) {
        onUploadSuccess({ metadataChanged: appMetadataChanged });
      }
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
