import React, { useEffect, useState, useMemo } from "react";
import { publicTsRestClient, getFreshAuthorizedTsRestClient } from "@api/tsRestClient.ts";
import { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import { FileMetadata } from "@shared/domain/readModels/project/FileMetadata.ts";
import { assertDefined } from "@shared/util/assertions.ts";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import Keycloak from "keycloak-js";
import { extractFilename, TEXT_FILE_EXTENSIONS, IMAGE_FILE_EXTENSIONS } from "@utils/fileUtils.ts";

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4 text-slate-300 hover:text-slate-100"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    style={{ display: "inline", verticalAlign: "middle" }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
    />
  </svg>
);

// Helper function to determine preview type based on mimetype and filename
const getPreviewType = (mimetype: string, filename?: string): string => {
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
  
  // Fallback: if MIME type is generic (like application/octet-stream), 
  // try to determine type from file extension
  if (filename && (mimetype === "application/octet-stream" || mimetype === "application/octet")) {
    const extension = filename.toLowerCase().split(".").pop() || "";
    
    if (extension === "py") {
      return "python";
    }
    if (extension === "json") {
      return "json";
    }
    if (TEXT_FILE_EXTENSIONS.includes(extension as any)) {
      return "text";
    }
    if (IMAGE_FILE_EXTENSIONS.includes(extension as any)) {
      return "image";
    }
  }
  
  return "unsupported";
};

// Helper function to detect programming language from file extension
const getLanguageFromFile = (filename: string): string => {
  const extension = filename.toLowerCase().split(".").pop() || "";
  const languageMap: { [key: string]: string } = {
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

// JSON Preview Component with pretty print option and syntax highlighting
const JsonPreview: React.FC<{ content: string }> = ({ content }) => {
  const [isPretty, setIsPretty] = useState(false);

  const formatJson = (jsonStr: string): string => {
    try {
      const parsed = JSON.parse(jsonStr);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      console.warn('Failed to parse JSON, displaying raw content:', error);
      return jsonStr;
    }
  };

  const displayContent = isPretty ? formatJson(content) : content;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-slate-300 text-sm">JSON file</span>
        <button
          type="button"
          onClick={() => setIsPretty(!isPretty)}
          className="px-2 py-1 bg-slate-700 text-slate-200 rounded text-xs hover:bg-slate-600"
        >
          {isPretty ? "Show Raw" : "Pretty Print"}
        </button>
      </div>
      <div className="rounded overflow-hidden">
        <SyntaxHighlighter
          language="json"
          style={atomOneDark}
          customStyle={{
            background: "#1e293b", // Slate-800 to match app theme
            padding: "1rem",
            margin: 0,
            fontSize: "0.875rem",
            lineHeight: "1.25rem",
          }}
          showLineNumbers={false}
          wrapLines={true}
          wrapLongLines={true}
        >
          {displayContent}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

// Python Preview Component with syntax highlighting
const PythonPreview: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div>
      <div className="mb-2">
        <span className="text-slate-300 text-sm">Python file</span>
      </div>
      <div className="rounded overflow-hidden">
        <SyntaxHighlighter
          language="python"
          style={atomOneDark}
          customStyle={{
            background: "#1e293b", // Slate-800 to match app theme
            padding: "1rem",
            margin: 0,
            fontSize: "0.875rem",
            lineHeight: "1.25rem",
          }}
          showLineNumbers={false}
          wrapLines={true}
          wrapLongLines={true}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

// Text Preview Component with syntax highlighting for recognized file types
const TextPreview: React.FC<{ content: string; filename: string }> = ({
  content,
  filename,
}) => {
  const language = getLanguageFromFile(filename);

  if (language === "text") {
    // Plain text - use basic pre/code styling
    return (
      <div>
        <div className="mb-2">
          <span className="text-slate-300 text-sm">Text file</span>
        </div>
        <pre className="text-slate-300 whitespace-pre-wrap break-words">
          <code>{content}</code>
        </pre>
      </div>
    );
  }

  // Use syntax highlighting for recognized programming languages
  return (
    <div>
      <div className="mb-2">
        <span className="text-slate-300 text-sm">{language} file</span>
      </div>
      <div className="rounded overflow-hidden">
        <SyntaxHighlighter
          language={language}
          style={atomOneDark}
          customStyle={{
            background: "#1e293b", // Slate-800 to match app theme
            padding: "1rem",
            margin: 0,
            fontSize: "0.875rem",
            lineHeight: "1.25rem",
          }}
          showLineNumbers={false}
          wrapLines={true}
          wrapLongLines={true}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

// Image Preview Component
const ImagePreview: React.FC<{ file: FileMetadata; imageBlob?: Blob }> = ({ file, imageBlob }) => {
  const [imageUrl, setImageUrl] = useState<string>(file.url || "");

  useEffect(() => {
    if (imageBlob) {
      const url = URL.createObjectURL(imageBlob);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (file.url) {
      setImageUrl(file.url);
    }
  }, [imageBlob, file.url]);

  return (
    <div>
      <div className="mb-2">
        <span className="text-slate-300 text-sm">
          Image file{" "}
          {file.image_width &&
            file.image_height &&
            `(${file.image_width}×${file.image_height})`}
        </span>
      </div>
      <div className="flex justify-center">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={file.full_path}
            className="max-w-full max-h-96 rounded border border-slate-600"
            style={{ maxHeight: "400px" }}
          />
        )}
      </div>
    </div>
  );
};

// No Preview Component for unsupported types
const NoPreview: React.FC<{ mimetype: string }> = ({ mimetype }) => {
  return (
    <div className="text-center py-8 text-slate-400">
      <p>Preview not available for this file type.</p>
      <p className="text-sm mt-2">MIME type: {mimetype}</p>
      <p className="text-sm">Use the download button to view the file.</p>
    </div>
  );
};

// Helper function to render file preview content
const renderFilePreview = (
  loading: boolean,
  previewedFile: string | null,
  currentFile: FileMetadata | null,
  fileContent: string | null,
  imageBlob?: Blob
): React.ReactElement => {
  if (loading) {
    return <div className="text-slate-400">Loading file...</div>;
  }

  if (!previewedFile) {
    return <div className="text-slate-400">No file selected</div>;
  }

  if (!currentFile) {
    return <div className="text-slate-400">File not found</div>;
  }

  const previewType = getPreviewType(currentFile.mimetype, currentFile.full_path);

  switch (previewType) {
    case "image":
      return <ImagePreview file={currentFile} imageBlob={imageBlob} />;
    case "json":
      return fileContent ? (
        <JsonPreview content={fileContent} />
      ) : (
        <div className="text-slate-400">Loading JSON...</div>
      );
    case "python":
      return fileContent ? (
        <PythonPreview content={fileContent} />
      ) : (
        <div className="text-slate-400">Loading Python file...</div>
      );
    case "text":
      return fileContent ? (
        <TextPreview
          content={fileContent}
          filename={currentFile.full_path}
        />
      ) : (
        <div className="text-slate-400">Loading text file...</div>
      );
    case "unsupported":
      return <NoPreview mimetype={currentFile.mimetype} />;
    default:
      return <div className="text-slate-400">Unknown file type</div>;
  }
};

interface AppCodePreviewProps {
  project: ProjectDetails;
  isDraft?: boolean;
  keycloak?: Keycloak;
  previewedFile?: string | null;
  showFileList?: boolean;
}

const AppCodePreview: React.FC<AppCodePreviewProps> = ({ 
  project, 
  isDraft = false, 
  keycloak, 
  previewedFile: externalPreviewedFile,
  showFileList = true 
}) => {
  const files = useMemo(() => project?.version?.files ?? [], [project?.version?.files]);
  const [previewedFile, setPreviewedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);

  // Get the currently previewed file metadata
  const currentFile = files.find((f) => f.full_path === previewedFile) || null;

  // Use external previewedFile if provided, otherwise find __init__.py by default
  useEffect(() => {
    if (externalPreviewedFile !== undefined) {
      setPreviewedFile(externalPreviewedFile);
      return;
    }
    
    if (!files?.length) {
      setPreviewedFile(null);
      setFileContent(null);
      setImageBlob(null);
      return;
    }
    const initFile = files.find(
      (f) =>
        (f.name === "__init__" && f.ext === "py") ||
        f.full_path === "__init__.py"
    );
    if (initFile) {
      setPreviewedFile(initFile.full_path);
    } else {
      setPreviewedFile(null);
      setFileContent(null);
      setImageBlob(null);
    }
  }, [files, externalPreviewedFile]);

  // Fetch file content when previewedFile changes
  useEffect(() => {
    if (!previewedFile || !currentFile) {
      setFileContent(null);
      setImageBlob(null);
      return;
    }

    // For unsupported types, don't fetch content
    if (getPreviewType(currentFile.mimetype, currentFile.full_path) === "unsupported") {
      setFileContent(null);
      setImageBlob(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchContent = async () => {
      try {
        if (isDraft) {
          // Draft mode - use authenticated API
          assertDefined(keycloak);
          const client = await getFreshAuthorizedTsRestClient(keycloak);
          const response = await client.getDraftFile({
            params: { slug: project.slug, filePath: previewedFile },
          });

          if (response.status === 200 && response.body) {
            const blob = response.body as Blob;

            // For images, store the blob for display
            if (getPreviewType(currentFile.mimetype, currentFile.full_path) === "image") {
              setImageBlob(blob);
              setFileContent(null);
            } else {
              // For text files, convert blob to text
              const text = await blob.text();
              setFileContent(text);
              setImageBlob(null);
            }
          } else {
            setFileContent("// Unable to load file");
            setImageBlob(null);
          }
        } else {
          // Published mode - use public API
          const res = await publicTsRestClient.getLatestPublishedFile({
            params: {
              slug: project.slug,
              filePath: previewedFile,
            },
          });

          if (res.status === 200) {
            if (getPreviewType(currentFile.mimetype, currentFile.full_path) === "image") {
              // For published images, we use the file.url directly (no blob needed)
              setImageBlob(null);
              setFileContent(null);
            } else if (typeof res.body === "string") {
              setFileContent(res.body);
              setImageBlob(null);
            } else if (res.body instanceof Blob) {
              const text = await res.body.text();
              setFileContent(text);
              setImageBlob(null);
            } else {
              setFileContent("// Unable to display file content");
              setImageBlob(null);
            }
          } else {
            setFileContent("// Unable to load file");
            setImageBlob(null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch file content:', error);
        setFileContent("// Network error - please check your connection and try again");
        setImageBlob(null);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [previewedFile, project.slug, currentFile, isDraft, keycloak]);

  const handlePreview = (fullPath: string) => {
    setPreviewedFile(fullPath);
  };

  const handleDownload = async (file: FileMetadata) => {
    if (isDraft) {
      // Draft mode - download via API
      try {
        assertDefined(keycloak);
        const client = await getFreshAuthorizedTsRestClient(keycloak);
        const response = await client.getDraftFile({
          params: { slug: project.slug, filePath: file.full_path },
        });

        if (response.status === 200 && response.body) {
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
    } else {
      // Published mode - use direct URL
      window.location.href = file.url;
    }
  };

  return (
    <section className="bg-gray-800 p-6 rounded-lg shadow-lg text-left" data-testid="code-preview-section">
      <h2 className="text-2xl font-semibold text-slate-100 mb-4">
        Code Preview / Files
      </h2>
      {showFileList && (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 w-full">
            <h3 className="text-lg font-medium text-slate-200 mb-2">
              Project Files:
            </h3>
            <ul className="list-none text-slate-400 text-sm space-y-1">
              {files.map((f, i: number) => (
                <li key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-1 py-1 bg-slate-700 rounded hover:bg-slate-600"
                    onClick={() => handleDownload(f)}
                    title="Download file"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <DownloadIcon />
                  </button>
                  <button
                    type="button"
                    className={`text-left hover:underline font-mono ${
                      previewedFile === f.full_path
                        ? "text-slate-100 font-bold"
                        : "text-slate-400"
                    }`}
                    onClick={() => handlePreview(f.full_path)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handlePreview(f.full_path);
                      }
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                    title="Preview file"
                    aria-label={`Preview ${f.full_path}`}
                  >
                    {f.full_path}
                  </button>
                  {f.size_formatted ? (
                    <span className="ml-2 text-slate-500">
                      {f.size_formatted}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <div className={showFileList ? "mt-6 md:ml-0" : "mt-4"}>
        <div className="code-block font-mono text-sm bg-gray-900 rounded p-4 overflow-x-auto min-h-[200px]">
          {renderFilePreview(loading, previewedFile, currentFile, fileContent, imageBlob || undefined)}
        </div>
      </div>
    </section>
  );
};

export default AppCodePreview;