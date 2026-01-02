import {
  IMAGE_FILE_EXTENSIONS,
  TEXT_FILE_EXTENSIONS,
} from "@utils/fileUtils.ts";

export type PreviewType = "image" | "json" | "python" | "text" | "unsupported";

export const getPreviewType = (
  mimetype: string,
  filename?: string
): PreviewType => {
  if (mimetype.startsWith("image/")) {
    return "image";
  }
  if (mimetype === "application/json") {
    return "json";
  }
  if (
    mimetype === "text/x-python" ||
    mimetype === "application/x-python-code" ||
    mimetype === "text/x-python-script"
  ) {
    return "python";
  }
  if (mimetype === "text/plain" || mimetype.startsWith("text/")) {
    return "text";
  }

  if (
    filename &&
    (mimetype === "application/octet-stream" ||
      mimetype === "application/octet")
  ) {
    const extension = filename.toLowerCase().split(".").pop() || "";

    if (extension === "py") {
      return "python";
    }
    if (extension === "json") {
      return "json";
    }
    if (TEXT_FILE_EXTENSIONS.includes(extension as (typeof TEXT_FILE_EXTENSIONS)[number])) {
      return "text";
    }
    if (IMAGE_FILE_EXTENSIONS.includes(extension as (typeof IMAGE_FILE_EXTENSIONS)[number])) {
      return "image";
    }
  }

  return "unsupported";
};

export const getLanguageFromFile = (filename: string): string => {
  const extension = filename.toLowerCase().split(".").pop() || "";
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    json: "json",
    html: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    sh: "bash",
    bash: "bash",
    c: "c",
    cpp: "cpp",
    java: "java",
    php: "php",
    rb: "ruby",
    go: "go",
    rs: "rust",
    sql: "sql",
  };

  return languageMap[extension] || "text";
};
