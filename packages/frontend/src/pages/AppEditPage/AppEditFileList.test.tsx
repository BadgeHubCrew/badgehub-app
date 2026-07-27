import { render, screen } from "@__test__";
import { dummyApps } from "@__test__/fixtures";
import type { ISODateString } from "@shared/domain/readModels/ISODateString.ts";
import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import { describe, expect, it, vi } from "vitest";
import AppEditFileList from "./AppEditFileList.tsx";

vi.mock("./FileListItem.tsx", () => ({
  FileListItem: ({
    file,
    isRecent,
  }: {
    file: { full_path: string };
    isRecent?: boolean;
  }) => (
    <li
      data-testid="file-list-item"
      data-path={file.full_path}
      data-recent={isRecent ? "true" : "false"}
    >
      {file.full_path}
    </li>
  ),
}));

const keycloak = {
  updateToken: vi.fn().mockResolvedValue(true),
} as unknown as import("keycloak-js").default;

const withFiles = (
  project: ProjectDetails,
  files: Array<{ full_path: string; updated_at: ISODateString }>
): ProjectDetails => ({
  ...project,
  version: {
    ...project.version,
    files: files.map((file) => ({
      full_path: file.full_path,
      name: file.full_path.replace(/\.[^.]+$/, ""),
      ext: "py",
      size_formatted: "12 B",
      mimetype: "text/x-python",
      size_of_content: 5000,
      sha256: "e".repeat(64),
      url: "http://badgehub.p1m.nl/main.py",
      dir: "",
      created_at: file.updated_at,
      updated_at: file.updated_at,
    })),
  },
});

describe("AppEditFileList", () => {
  it("shows empty state when no files are present", () => {
    const details = dummyApps[0]?.details;
    expect(details).toBeDefined();
    if (!details) {
      throw new Error("Expected dummy project details");
    }
    const project = withFiles(details, []);
    render(
      <AppEditFileList project={project} slug="demo" keycloak={keycloak} />
    );

    expect(
      screen.getByText(/no files yet\. drop files above/i)
    ).toBeInTheDocument();
  });

  it("renders file list items sorted by most recently updated", () => {
    const details = dummyApps[0]?.details;
    expect(details).toBeDefined();
    if (!details) {
      throw new Error("Expected dummy project details");
    }
    const project = withFiles(details, [
      {
        full_path: "older.py",
        updated_at: "2023-01-01T00:00:00.000Z",
      },
      {
        full_path: "newer.py",
        updated_at: "2024-01-01T00:00:00.000Z",
      },
    ]);
    render(
      <AppEditFileList project={project} slug="demo" keycloak={keycloak} />
    );

    const items = screen.getAllByTestId("file-list-item");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute("data-path", "newer.py");
    expect(items[1]).toHaveAttribute("data-path", "older.py");
  });

  it("marks recent paths", () => {
    const details = dummyApps[0]?.details;
    expect(details).toBeDefined();
    if (!details) {
      throw new Error("Expected dummy project details");
    }
    const project = withFiles(details, [
      {
        full_path: "main.py",
        updated_at: "2024-01-01T00:00:00.000Z",
      },
    ]);
    render(
      <AppEditFileList
        project={project}
        slug="demo"
        keycloak={keycloak}
        recentPaths={new Set(["main.py"])}
      />
    );

    expect(screen.getByTestId("file-list-item")).toHaveAttribute(
      "data-recent",
      "true"
    );
  });
});
