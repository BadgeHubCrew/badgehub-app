import { render, screen } from "@__test__";
import { dummyApps } from "@__test__/fixtures";
import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import { describe, expect, it, vi } from "vitest";
import AppEditFileList from "./AppEditFileList.tsx";

vi.mock("./FileListItem.tsx", () => ({
  FileListItem: () => <li data-testid="file-list-item" />,
}));

const keycloak = {
  updateToken: vi.fn().mockResolvedValue(true),
} as unknown as import("keycloak-js").default;

const withFiles = (project: ProjectDetails, count: number): ProjectDetails => ({
  ...project,
  version: {
    ...project.version,
    files: Array.from({ length: count }, (_, index) => ({
      full_path: `file-${index}.py`,
      name: `file-${index}`,
      ext: "py",
      size: 12,
      size_formatted: "12 B",
      mimetype: "text/x-python",
      size_of_content: 5000,
      sha256: "e".repeat(64),
      url: "http://badgehub.p1m.nl/main.py",
      dir: "",
      created_at: "2023-01-01T00:00:00.000Z",
      updated_at: "2023-01-01T00:00:00.000Z",
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
    const project = withFiles(details, 0);
    render(
      <AppEditFileList project={project} slug="demo" keycloak={keycloak} />
    );

    expect(
      screen.getByText(/no files in this project version/i)
    ).toBeInTheDocument();
  });

  it("renders file list items when files exist", () => {
    const details = dummyApps[0]?.details;
    expect(details).toBeDefined();
    if (!details) {
      throw new Error("Expected dummy project details");
    }
    const project = withFiles(details, 2);
    render(
      <AppEditFileList project={project} slug="demo" keycloak={keycloak} />
    );

    expect(screen.getAllByTestId("file-list-item")).toHaveLength(2);
  });
});
