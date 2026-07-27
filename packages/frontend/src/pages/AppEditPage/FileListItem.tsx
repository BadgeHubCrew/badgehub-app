import type { FileMetadata } from "@shared/domain/readModels/project/FileMetadata.ts";
import { DownloadIcon } from "@sharedComponents/AppsGrid/DownloadIcon.tsx";
import { DeleteIcon } from "@sharedComponents/icons/DeleteIcon.tsx";
import { downloadProjectFile } from "@utils/downloadProjectFile.ts";
import { NON_EXECUTABLE_EXTENSIONS } from "@utils/fileUtils.ts";
import { formatRelativeTime } from "@utils/formatRelativeTime.ts";
import type Keycloak from "keycloak-js";
import type React from "react";

/**
 * Determines if a file can be deleted.
 * The `metadata.json` file is protected.
 * @param file The file metadata object.
 */
const isDeletable = (file: FileMetadata) => file.full_path !== "metadata.json";

interface FileListItemProps {
  file: FileMetadata;
  iconFilePath?: string;
  onSetIcon?: (filePath: string) => void;
  onDeleteFile?: (filePath: string) => void;
  mainExecutable?: string;
  onSetMainExecutable?: (filePath: string) => void;
  onPreview?: (filePath: string) => void;
  slug: string;
  keycloak: Keycloak;
  isRecent?: boolean;
}

/**
 * Renders a single row in the file list.
 * It encapsulates the logic for displaying the file name, size,
 * and the action buttons.
 */
export const FileListItem: React.FC<FileListItemProps> = ({
  file,
  iconFilePath,
  onSetIcon,
  onDeleteFile,
  mainExecutable,
  onSetMainExecutable,
  onPreview,
  slug,
  keycloak,
  isRecent = false,
}) => {
  const isCurrentIcon = iconFilePath === file.full_path;
  const showIconButton = onSetIcon && file.mimetype.startsWith("image/");
  const deletable = isDeletable(file);

  const isSelectableAsMain =
    deletable &&
    onSetMainExecutable &&
    !(NON_EXECUTABLE_EXTENSIONS as readonly string[]).includes(
      `.${file.ext.toLowerCase()}`
    );
  const isCurrentMain = mainExecutable === file.full_path;

  const widthXHeight =
    (file.image_width &&
      file.image_height &&
      `${file.image_width}x${file.image_height}`) ||
    false;

  const absoluteUpdated = new Date(file.updated_at).toLocaleString();
  const relativeUpdated = formatRelativeTime(file.updated_at);

  return (
    <li
      className={`flex flex-wrap items-center gap-2 p-1 rounded-md transition-colors duration-200 hover:bg-base-300/50 ${
        isRecent ? "bg-success/15 ring-1 ring-success/30" : ""
      }`}
      data-recent={isRecent ? "true" : "false"}
    >
      {/* Download Button */}
      <button
        type="button"
        className="btn btn-sm btn-info p-1"
        title="Download draft file"
        onClick={() => downloadProjectFile(keycloak, slug, file)}
      >
        <DownloadIcon />
      </button>
      {/* Delete Button */}
      {onDeleteFile && (
        <button
          type="button"
          className={`btn btn-sm btn-error p-1 ${deletable ? "" : "opacity-50 cursor-not-allowed"}`}
          title={deletable ? "Delete file" : "This file cannot be deleted"}
          onClick={() => deletable && onDeleteFile(file.full_path)}
          disabled={!deletable}
        >
          <DeleteIcon />
        </button>
      )}
      {/* File Path and Size */}
      {onPreview ? (
        <button
          type="button"
          className="flex-grow font-mono opacity-70 hover:opacity-100 hover:underline text-left bg-transparent border-none cursor-pointer p-0 min-w-0"
          onClick={() => onPreview(file.full_path)}
          title="Preview file"
        >
          {file.full_path}
        </button>
      ) : (
        <p className="flex-grow font-mono opacity-60 min-w-0">
          {file.full_path}
        </p>
      )}
      {file.size_formatted && (
        <span className="opacity-60 text-xs shrink-0">
          {file.size_formatted}
        </span>
      )}
      {widthXHeight && (
        <span className="opacity-60 text-xs shrink-0">{widthXHeight}px</span>
      )}
      <span
        className="opacity-60 text-xs shrink-0 whitespace-nowrap"
        title={`Last updated: ${absoluteUpdated}`}
      >
        Updated {relativeUpdated}
      </span>
      {/* "Set as Main" Button */}
      {isSelectableAsMain && (
        <button
          type="button"
          disabled={isCurrentMain}
          onClick={() => onSetMainExecutable(file.full_path)}
          className={`btn btn-xs ${isCurrentMain ? "btn-info" : "btn-ghost"}`}
          title={
            isCurrentMain
              ? "This is the main executable"
              : "Set as main executable"
          }
        >
          {isCurrentMain ? "Main" : "Set as Main"}
        </button>
      )}
      {/* "Set as Icon" Button */}
      {showIconButton && (
        <button
          type="button"
          className={`btn btn-xs ${isCurrentIcon ? "btn-success" : "btn-ghost"}`}
          onClick={() => onSetIcon(file.full_path)}
          title={
            isCurrentIcon ? "This file is the current icon" : "Set as icon"
          }
          disabled={isCurrentIcon}
        >
          {isCurrentIcon ? "Icon" : "Set as Icon"}
        </button>
      )}
    </li>
  );
};
