import React from "react";
import { FileMetadata } from "@shared/domain/readModels/project/FileMetadata.ts";
import { DeleteIcon } from "@sharedComponents/icons/DeleteIcon.tsx";
import { DownloadIcon } from "@sharedComponents/AppsGrid/DownloadIcon.tsx";
import { IconSize } from "@shared/domain/readModels/project/AppMetadataJSON.ts";
import Keycloak from "keycloak-js";
import { IMAGE_FILE_EXTENSIONS } from "@utils/fileUtils.ts";
import { downloadProjectFile } from "@utils/downloadProjectFile.ts";

/**
 * Checks if a file is a PNG image.
 * @param filePath The full path of the file.
 */
const isPng = (filePath: string) => filePath.toLowerCase().endsWith(".png");
/**
 * Determines if a file can be deleted.
 * The `metadata.json` file is protected.
 * @param file The file metadata object.
 */
const isDeletable = (file: FileMetadata) => file.full_path !== "metadata.json";

interface FileListItemProps {
  file: FileMetadata;
  iconFilePath?: string;
  onSetIcon?: (size: IconSize, filePath: string) => void;
  onDeleteFile?: (filePath: string) => void;
  mainExecutable?: string;
  onSetMainExecutable?: (filePath: string) => void;
  onPreview?: (filePath: string) => void;
  slug: string;
  keycloak: Keycloak;
}

const bigIconSize = "64x64";

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
}) => {
  const isCurrentIcon = iconFilePath === file.full_path;
  const showIconButton = onSetIcon && isPng(file.full_path);
  const isRightSize =
    showIconButton && file.image_height === 64 && file.image_width === 64;
  const deletable = isDeletable(file);

  const excludedExtensions = [
    ...IMAGE_FILE_EXTENSIONS.map((ext) => `.${ext}`),
    ".md",
    ".txt",
    ".json",
  ];
  const isSelectableAsMain =
    deletable &&
    onSetMainExecutable &&
    !excludedExtensions.some((ext) =>
      file.full_path.toLowerCase().endsWith(ext)
    );
  const isCurrentMain = mainExecutable === file.full_path;

  const widthXHeight =
    (file.image_width &&
      file.image_height &&
      `${file.image_width}x${file.image_height}`) ||
    false;

  return (
    <li className="flex items-center gap-2 p-1 rounded-md transition-colors duration-200 hover:bg-gray-700/50">
      {/* Download Button */}
      <button
        type="button"
        className="bg-blue-600 text-white rounded p-1 flex items-center justify-center transition-colors hover:bg-blue-700"
        title="Download draft file"
        onClick={() => downloadProjectFile(keycloak, slug, file)}
      >
        <DownloadIcon />
      </button>
      {/* Delete Button */}
      {onDeleteFile && (
        <button
          type="button"
          className={`bg-red-600 text-white rounded p-1 flex items-center justify-center transition-colors ${
            deletable ? "hover:bg-red-700" : "opacity-50 cursor-not-allowed"
          }`}
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
          className="flex-grow font-mono text-slate-400 hover:text-slate-100 hover:underline text-left bg-transparent border-none cursor-pointer p-0"
          onClick={() => onPreview(file.full_path)}
          title="Preview file"
        >
          {file.full_path}
        </button>
      ) : (
        <p className="flex-grow font-mono text-slate-400">{file.full_path}</p>
      )}
      {file.size_formatted && (
        <span className="ml-2 text-slate-500 text-xs">
          {file.size_formatted}
        </span>
      )}{" "}
      {widthXHeight && (
        <span className="ml-2 text-slate-500 text-xs">{widthXHeight}px</span>
      )}
      {/* "Set as Main" Button */}
      {isSelectableAsMain && (
        <button
          type="button"
          disabled={isCurrentMain}
          onClick={() => onSetMainExecutable(file.full_path)}
          className={`ml-2 px-2 py-1 rounded text-xs ${isCurrentMain ? "bg-blue-600 text-white cursor-default" : "bg-gray-700 text-slate-300 hover:bg-blue-700"}`}
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
          className={`ml-2 px-2 py-1 rounded text-xs transition-colors duration-200 ${
            isCurrentIcon
              ? "bg-emerald-600 text-white cursor-default"
              : "bg-gray-700 text-slate-300 hover:bg-emerald-700 hover:text-white"
          }`}
          onClick={() => onSetIcon(bigIconSize, file.full_path)}
          title={
            isCurrentIcon
              ? "This file is the current icon"
              : isRightSize
                ? "Set as " + bigIconSize + " icon"
                : `Image is ${widthXHeight}, icons should be ${bigIconSize}`
          }
          disabled={isCurrentIcon || !isRightSize}
        >
          {isCurrentIcon ? "Icon" : isRightSize ? "Set as Icon" : "Wrong Size"}
        </button>
      )}
    </li>
  );
};
