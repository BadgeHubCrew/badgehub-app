import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AppCodePreview from "./AppCodePreview";

// Mock the API client
vi.mock("@api/apiClient.ts", () => ({
  publicApiClient: {
    getLatestPublishedFile: vi.fn().mockImplementation(({ params }) => {
      // Mock different responses based on file path
      if (params.filePath === "test.json") {
        return Promise.resolve({
          status: 200,
          body: '{"name": "test", "version": "1.0.0", "description": "A test JSON file"}',
        });
      }
      if (params.filePath === "example.py") {
        return Promise.resolve({
          status: 200,
          body: 'def hello_world():\n    print("Hello, BadgeHub!")\n    return "success"',
        });
      }
      if (params.filePath === "readme.txt") {
        return Promise.resolve({
          status: 200,
          body: "This is a simple text file.\nIt contains multiple lines.\nEach line is plain text.",
        });
      }
      if (params.filePath === "parsed.json") {
        // The API client may return already-parsed application/json (see #398),
        // so the body arrives as an object, not a string/Blob.
        return Promise.resolve({
          status: 200,
          body: { name: "parsed", version: "2.0.0" },
        });
      }
      if (params.filePath === "null.json") {
        // A .json file whose content is the literal JSON value `null` is
        // valid and should still render, not fall through to the
        // "unable to display" message.
        return Promise.resolve({
          status: 200,
          body: null,
        });
      }
      return Promise.resolve({
        status: 404,
        body: "File not found",
      });
    }),
  },
}));

const mockProject: ProjectDetails = {
  slug: "test-project",
  idp_user_id: "author-id",
  latest_revision: 1,
  version: {
    revision: 1,
    files: [
      {
        dir: "",
        name: "test",
        ext: "json",
        mimetype: "application/json",
        size_of_content: 100,
        sha256: "a".repeat(64),
        size_formatted: "100 B",
        full_path: "test.json",
        url: "http://example.com/test.json",
        created_at: "2023-01-01T00:00:00.000Z",
        updated_at: "2023-01-01T00:00:00.000Z",
      },
      {
        dir: "",
        name: "example",
        ext: "py",
        mimetype: "text/x-python",
        size_of_content: 200,
        sha256: "b".repeat(64),
        size_formatted: "200 B",
        full_path: "example.py",
        url: "http://example.com/example.py",
        created_at: "2023-01-01T00:00:00.000Z",
        updated_at: "2023-01-01T00:00:00.000Z",
      },
      {
        dir: "",
        name: "image",
        ext: "png",
        mimetype: "image/png",
        image_width: 100,
        image_height: 50,
        size_of_content: 1024,
        sha256: "c".repeat(64),
        size_formatted: "1 KB",
        full_path: "image.png",
        url: "http://example.com/image.png",
        created_at: "2023-01-01T00:00:00.000Z",
        updated_at: "2023-01-01T00:00:00.000Z",
      },
      {
        dir: "",
        name: "readme",
        ext: "txt",
        mimetype: "text/plain",
        size_of_content: 500,
        sha256: "d".repeat(64),
        size_formatted: "500 B",
        full_path: "readme.txt",
        url: "http://example.com/readme.txt",
        created_at: "2023-01-01T00:00:00.000Z",
        updated_at: "2023-01-01T00:00:00.000Z",
      },
      {
        dir: "",
        name: "parsed",
        ext: "json",
        mimetype: "application/json",
        size_of_content: 50,
        sha256: "g".repeat(64),
        size_formatted: "50 B",
        full_path: "parsed.json",
        url: "http://example.com/parsed.json",
        created_at: "2023-01-01T00:00:00.000Z",
        updated_at: "2023-01-01T00:00:00.000Z",
      },
      {
        dir: "",
        name: "null",
        ext: "json",
        mimetype: "application/json",
        size_of_content: 4,
        sha256: "h".repeat(64),
        size_formatted: "4 B",
        full_path: "null.json",
        url: "http://example.com/null.json",
        created_at: "2023-01-01T00:00:00.000Z",
        updated_at: "2023-01-01T00:00:00.000Z",
      },
      {
        dir: "",
        name: "Warning",
        ext: "wav",
        mimetype: "audio/x-wav",
        size_of_content: 8264,
        sha256: "f".repeat(64),
        size_formatted: "8.07 KB",
        full_path: "sounds/Warning.wav",
        url: "http://example.com/sounds/Warning.wav",
        created_at: "2023-01-01T00:00:00.000Z",
        updated_at: "2023-01-01T00:00:00.000Z",
      },
      {
        dir: "",
        name: "document",
        ext: "pdf",
        mimetype: "application/pdf",
        size_of_content: 5000,
        sha256: "e".repeat(64),
        size_formatted: "5 KB",
        full_path: "document.pdf",
        url: "http://example.com/document.pdf",
        created_at: "2023-01-01T00:00:00.000Z",
        updated_at: "2023-01-01T00:00:00.000Z",
      },
    ],
    app_metadata: {
      name: "Test Project",
      version: "1.0.0",
      description: "Test description",
      author: "Test Author",
    },
    published_at: "2023-01-01T00:00:00.000Z",
  },
  created_at: "2023-01-01T00:00:00.000Z",
  updated_at: "2023-01-01T00:00:00.000Z",
};

describe("AppCodePreview", () => {
  it("renders the component with file list", () => {
    render(<AppCodePreview project={mockProject} />);

    expect(screen.getByText("Code Preview / Files")).toBeInTheDocument();
    expect(screen.getByText("Project Files:")).toBeInTheDocument();
    expect(screen.getByText("test.json")).toBeInTheDocument();
    expect(screen.getByText("example.py")).toBeInTheDocument();
    expect(screen.getByText("image.png")).toBeInTheDocument();
    expect(screen.getByText("readme.txt")).toBeInTheDocument();
    expect(screen.getByText("document.pdf")).toBeInTheDocument();
  });

  it("shows no preview message for unsupported file types", async () => {
    render(<AppCodePreview project={mockProject} />);

    // Click on PDF file
    const pdfButton = screen.getByText("document.pdf");
    fireEvent.click(pdfButton);

    // Should show unsupported message
    expect(
      await screen.findByText("Preview not available for this file type.")
    ).toBeInTheDocument();
    expect(screen.getByText("MIME type: application/pdf")).toBeInTheDocument();
  });

  it("shows image preview for image files", async () => {
    render(<AppCodePreview project={mockProject} />);

    // Click on image file
    const imageButton = screen.getByText("image.png");
    fireEvent.click(imageButton);

    // Should show image preview
    expect(await screen.findByText("Image file (100×50)")).toBeInTheDocument();
    const img = screen.getByAltText("image.png");
    expect(img).toBeInTheDocument();
    // Wait for the async useEffect in ImagePreview to set the src attribute
    await waitFor(() => {
      expect(img).toHaveAttribute("src", "http://example.com/image.png");
    });
  });

  it("shows an audio player for WAV files", async () => {
    render(<AppCodePreview project={mockProject} />);

    fireEvent.click(screen.getByText("sounds/Warning.wav"));

    expect(await screen.findByText("Audio file")).toBeInTheDocument();
    const audio = document.querySelector("audio");
    expect(audio).toHaveAttribute("controls");
    expect(audio).toHaveAttribute(
      "src",
      "http://example.com/sounds/Warning.wav"
    );
    expect(
      screen.queryByText("Preview not available for this file type.")
    ).not.toBeInTheDocument();
  });

  it("shows JSON preview with pretty print functionality", async () => {
    render(<AppCodePreview project={mockProject} />);

    // Click on JSON file
    const jsonButton = screen.getByText("test.json");
    fireEvent.click(jsonButton);

    // Should show JSON preview
    expect(await screen.findByText("JSON file")).toBeInTheDocument();
    expect(screen.getByText("Pretty Print")).toBeInTheDocument();

    // Check that JSON content parts are displayed (syntax highlighting splits text)
    expect(screen.getByText('"test"')).toBeInTheDocument();
    expect(screen.getByText('"version"')).toBeInTheDocument();
    expect(screen.getByText('"1.0.0"')).toBeInTheDocument();

    // Test pretty print toggle
    const prettyPrintButton = screen.getByText("Pretty Print");
    fireEvent.click(prettyPrintButton);
    expect(screen.getByText("Show Raw")).toBeInTheDocument();
  });

  it("shows JSON preview when the client returns an already-parsed body", async () => {
    render(<AppCodePreview project={mockProject} />);

    fireEvent.click(screen.getByText("parsed.json"));

    expect(await screen.findByText("JSON file")).toBeInTheDocument();
    expect(
      screen.queryByText("// Unable to display file content")
    ).not.toBeInTheDocument();
    expect(screen.getByText('"parsed"')).toBeInTheDocument();
    expect(screen.getByText('"2.0.0"')).toBeInTheDocument();
  });

  it("pretty print actually reformats an already-parsed JSON body", async () => {
    const { container } = render(<AppCodePreview project={mockProject} />);

    fireEvent.click(screen.getByText("parsed.json"));
    await screen.findByText("JSON file");

    // Raw view should be compact (no line breaks), otherwise toggling to
    // Pretty Print has nothing to actually change.
    const rawText = container.querySelector("pre")?.textContent ?? "";
    expect(rawText).not.toMatch(/\n/);

    fireEvent.click(screen.getByText("Pretty Print"));
    const prettyText = container.querySelector("pre")?.textContent ?? "";
    expect(prettyText).toMatch(/\n/);
  });

  it("renders a JSON file whose content is the literal value null", async () => {
    const { container } = render(<AppCodePreview project={mockProject} />);

    fireEvent.click(screen.getByText("null.json"));

    expect(await screen.findByText("JSON file")).toBeInTheDocument();
    expect(
      screen.queryByText("// Unable to display file content")
    ).not.toBeInTheDocument();
    expect(container.querySelector("pre")?.textContent).toBe("null");
  });

  it("shows Python preview with syntax highlighting", async () => {
    render(<AppCodePreview project={mockProject} />);

    // Click on Python file
    const pythonButton = screen.getByText("example.py");
    fireEvent.click(pythonButton);

    // Should show Python preview
    expect(await screen.findByText("Python file")).toBeInTheDocument();

    // Check that Python code parts are displayed (syntax highlighting splits text)
    expect(screen.getByText("def")).toBeInTheDocument();
    expect(screen.getByText("hello_world")).toBeInTheDocument();
    expect(screen.getByText("print")).toBeInTheDocument();
    expect(screen.getByText('"Hello, BadgeHub!"')).toBeInTheDocument();
  });

  it("shows text preview for plain text files", async () => {
    render(<AppCodePreview project={mockProject} />);

    // Click on text file
    const textButton = screen.getByText("readme.txt");
    fireEvent.click(textButton);

    // Should show text content
    expect(
      await screen.findByText(/This is a simple text file/)
    ).toBeInTheDocument();
    expect(screen.getByText(/It contains multiple lines/)).toBeInTheDocument();
  });
});
