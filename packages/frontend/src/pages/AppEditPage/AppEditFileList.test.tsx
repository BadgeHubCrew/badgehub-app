import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@__test__";
import AppEditFileList from "./AppEditFileList.tsx";
import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import { dummyApps } from "@__test__/fixtures";

vi.mock("./FileListItem.tsx", () => ({
  FileListItem: () => <li data-testid="file-list-item" />,
}));

const keycloak = { updateToken: vi.fn().mockResolvedValue(true) } as any;

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
    })),
  },
});

describe("AppEditFileList", () => {
  it("shows empty state when no files are present", () => {
    const project = withFiles(dummyApps[0]!.details, 0);
    render(
      <AppEditFileList
        project={project}
        slug="demo"
        keycloak={keycloak}
      />
    );

    expect(
      screen.getByText(/no files in this project version/i)
    ).toBeInTheDocument();
  });

  it("renders file list items when files exist", () => {
    const project = withFiles(dummyApps[0]!.details, 2);
    render(
      <AppEditFileList
        project={project}
        slug="demo"
        keycloak={keycloak}
      />
    );

    expect(screen.getAllByTestId("file-list-item")).toHaveLength(2);
  });
});
