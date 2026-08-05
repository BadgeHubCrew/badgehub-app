import { getAuthorizationHeader, getFreshToken } from "@api/apiClient.ts";
import { uploadDraftFile } from "@api/uploadDraftFile.ts";
import { MAX_UPLOAD_FILE_SIZE_BYTES } from "@shared/config/sharedConfig.ts";
import { assertDefined } from "@shared/util/assertions.ts";
import { isExecutableFileName } from "@utils/fileUtils.ts";
import type Keycloak from "keycloak-js";
import type React from "react";
import { useCallback, useRef, useState } from "react";

const MAX_UPLOAD_FILE_SIZE_MB = MAX_UPLOAD_FILE_SIZE_BYTES / (1024 * 1024);

export type UploadSuccessResult = {
  metadataChanged?: boolean;
  firstValidExecutable?: string | null;
  uploadedPaths?: string[];
};

function formatUploadErrorBody(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.reason === "string" && record.reason.trim()) {
      return record.reason;
    }
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
  }
  return `HTTP ${status}`;
}

type FileUploadItemStatus = "pending" | "uploading" | "success" | "error";

type FileUploadItem = {
  id: string;
  name: string;
  status: FileUploadItemStatus;
  errorMessage?: string;
};

type UploadProgressState = {
  /** Overall bytes accounted for (completed files + current file progress). */
  loaded: number;
  /** Sum of selected file sizes (at least 1 per file so empty files still move the bar). */
  total: number;
  /** 0-based index of the file currently uploading. */
  fileIndex: number;
  fileCount: number;
  currentFileName: string | null;
};

function fileSizeForProgress(file: File): number {
  // Empty files would otherwise make total=0 and freeze the bar at 0.
  return Math.max(file.size, 1);
}

const AppEditFileUpload: React.FC<{
  slug: string;
  onUploadSuccess: (result: UploadSuccessResult) => void;
  keycloak?: Keycloak | undefined;
}> = ({ slug, onUploadSuccess, keycloak }) => {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [items, setItems] = useState<FileUploadItem[]>([]);
  const [progress, setProgress] = useState<UploadProgressState>({
    loaded: 0,
    total: 0,
    fileIndex: 0,
    fileCount: 0,
    currentFileName: null,
  });
  const dragDepthRef = useRef(0);
  const uploadingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateItem = useCallback(
    (id: string, patch: Partial<FileUploadItem>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    []
  );

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      assertDefined(keycloak);
      const files = Array.from(fileList);
      if (files.length === 0 || uploadingRef.current) return;

      uploadingRef.current = true;
      setError(null);
      setSuccess(null);
      setUploading(true);

      const totalBytes = files.reduce(
        (sum, file) => sum + fileSizeForProgress(file),
        0
      );
      setProgress({
        loaded: 0,
        total: totalBytes,
        fileIndex: 0,
        fileCount: files.length,
        currentFileName: files[0]?.name ?? null,
      });

      const initialItems: FileUploadItem[] = files.map((file, index) => ({
        id: `${file.name}-${index}`,
        name: file.name,
        status: "pending",
      }));
      setItems(initialItems);

      const succeeded: string[] = [];
      const failed: Array<{ name: string; message: string }> = [];
      let appMetadataChanged = false;
      let completedBytes = 0;

      try {
        // Ensure token is warm once; each request still refreshes if needed.
        await getFreshToken(keycloak);

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          assertDefined(file);
          const itemId = initialItems[i]?.id ?? `${file.name}-${i}`;
          const fileBudget = fileSizeForProgress(file);

          updateItem(itemId, { status: "uploading" });
          setProgress({
            loaded: completedBytes,
            total: totalBytes,
            fileIndex: i,
            fileCount: files.length,
            currentFileName: file.name,
          });

          try {
            if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
              throw new Error(
                `File too large (max ${MAX_UPLOAD_FILE_SIZE_MB} MB)`
              );
            }

            const { authorization } = await getAuthorizationHeader(keycloak);
            const res = await uploadDraftFile({
              slug,
              filePath: file.name,
              file,
              authorization,
              onProgress: ({ loaded, total }) => {
                // Prefer real request total when XHR provides it; otherwise file size.
                const requestTotal =
                  total > 0 ? total : Math.max(file.size, loaded);
                const fraction =
                  requestTotal > 0 ? Math.min(loaded / requestTotal, 1) : 1;
                const currentBytes = Math.round(fraction * fileBudget);
                setProgress({
                  loaded: completedBytes + currentBytes,
                  total: totalBytes,
                  fileIndex: i,
                  fileCount: files.length,
                  currentFileName: file.name,
                });
              },
            });

            if (res.status !== 204) {
              throw new Error(
                `Upload failed for ${file.name}: ${formatUploadErrorBody(res.body, res.status)}`
              );
            }
            if (file.name === "metadata.json") {
              appMetadataChanged = true;
            }
            succeeded.push(file.name);
            updateItem(itemId, { status: "success" });
          } catch (err: unknown) {
            console.error(err);
            const message =
              err instanceof Error
                ? err.message
                : `Upload failed for ${file.name}`;
            failed.push({ name: file.name, message });
            updateItem(itemId, { status: "error", errorMessage: message });
          }

          completedBytes += fileBudget;
          setProgress({
            loaded: completedBytes,
            total: totalBytes,
            fileIndex: i,
            fileCount: files.length,
            currentFileName: file.name,
          });
        }

        if (succeeded.length > 0) {
          const nameSummary =
            succeeded.length <= 3
              ? succeeded.join(", ")
              : `${succeeded.slice(0, 3).join(", ")} +${succeeded.length - 3} more`;
          setSuccess(
            succeeded.length === 1
              ? `Uploaded ${nameSummary}.`
              : `Uploaded ${succeeded.length} files: ${nameSummary}.`
          );

          const firstValidFile = files.find(
            (f) => succeeded.includes(f.name) && isExecutableFileName(f.name)
          );
          onUploadSuccess({
            metadataChanged: appMetadataChanged,
            firstValidExecutable: firstValidFile ? firstValidFile.name : null,
            uploadedPaths: succeeded,
          });
        }

        if (failed.length > 0) {
          setError(
            failed.length === 1
              ? (failed[0]?.message ?? "Upload failed.")
              : `Upload failed for ${failed.length} files: ${failed.map((f) => f.name).join(", ")}.`
          );
        }
      } catch (err: unknown) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Failed to upload file(s)."
        );
      } finally {
        uploadingRef.current = false;
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [keycloak, onUploadSuccess, slug, updateItem]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(files);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (uploading) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const openFilePicker = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const currentUploading = items.find((item) => item.status === "uploading");
  const hasErrors = items.some((item) => item.status === "error");
  const showItemList = items.length > 1 || uploading || hasErrors;
  const percent =
    progress.total > 0
      ? Math.min(100, Math.round((progress.loaded / progress.total) * 100))
      : 0;

  return (
    <div className="form-control">
      {/* Drop target uses drag events; keyboard users use the browse button. */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: HTML5 file drop zone */}
      <div
        data-testid="app-edit-file-dropzone"
        data-dragging={isDragging ? "true" : "false"}
        className={`box-border rounded-box border-2 border-dashed p-6 text-center transition-colors duration-150 ring-2 ${
          isDragging
            ? "border-primary bg-primary/10 ring-primary/40"
            : "border-base-content/20 bg-base-100/40 ring-transparent"
        } ${uploading ? "opacity-70" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          id="app-edit-file-upload-input"
          type="file"
          name="file-upload"
          data-testid="app-edit-file-upload-input"
          className="hidden"
          multiple
          disabled={uploading}
          onChange={handleFileChange}
        />

        {/*
          Keep layout stable while dragging (no content swap / size change),
          and let pointer events hit the outer zone so children don't churn
          dragenter/dragleave. Browse re-enables pointer events for clicks.
        */}
        <div className="pointer-events-none">
          <p className={`font-medium ${isDragging ? "text-primary" : ""}`}>
            {isDragging ? (
              "Drop to upload"
            ) : (
              <>
                Drag &amp; drop files here, or{" "}
                <button
                  type="button"
                  className="link link-primary pointer-events-auto"
                  disabled={uploading}
                  onClick={openFilePicker}
                >
                  browse
                </button>
              </>
            )}
          </p>
          <p
            className={`text-xs mt-2 whitespace-normal break-words ${
              isDragging ? "opacity-0" : "opacity-60"
            }`}
            aria-hidden={isDragging}
          >
            Any file type is accepted (code, images, docs). Max{" "}
            {MAX_UPLOAD_FILE_SIZE_MB} MB per file. Executable files can be set
            as Main.
          </p>

          {uploading && progress.total > 0 && (
            <div className="mt-4 text-left">
              <progress
                className="progress progress-primary w-full"
                value={progress.loaded}
                max={progress.total}
                data-testid="app-edit-file-upload-progress"
              />
              <p className="text-xs opacity-70 mt-1">
                {currentUploading
                  ? `Uploading ${progress.fileIndex + 1} of ${progress.fileCount}: ${currentUploading.name} (${percent}%)`
                  : progress.loaded >= progress.total
                    ? `Uploaded ${progress.fileCount} of ${progress.fileCount}`
                    : `Uploading ${progress.fileIndex + 1} of ${progress.fileCount} (${percent}%)`}
              </p>
            </div>
          )}

          {showItemList && items.length > 0 && (
            <ul
              className="mt-3 text-left text-xs space-y-1 max-h-40 overflow-y-auto"
              data-testid="app-edit-file-upload-items"
            >
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-2 font-mono">
                  <span aria-hidden="true" className="w-4 shrink-0 text-center">
                    {item.status === "success" && "✓"}
                    {item.status === "uploading" && "↑"}
                    {item.status === "pending" && "○"}
                    {item.status === "error" && "✕"}
                  </span>
                  <span
                    className={
                      item.status === "error"
                        ? "text-error"
                        : item.status === "success"
                          ? "opacity-80"
                          : item.status === "uploading"
                            ? "text-primary"
                            : "opacity-50"
                    }
                  >
                    {item.name}
                    {item.status === "uploading" && " — Uploading…"}
                    {item.status === "error" &&
                      item.errorMessage &&
                      ` — ${item.errorMessage}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-error mt-2" role="alert">
          {error}
        </p>
      )}
      {success && !uploading && (
        <p className="text-xs text-success mt-2" role="status">
          {success}
        </p>
      )}
    </div>
  );
};

export default AppEditFileUpload;
