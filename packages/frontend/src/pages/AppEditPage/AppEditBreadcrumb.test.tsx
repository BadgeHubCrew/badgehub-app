import { describe, expect, it } from "vitest";
import { render, screen } from "@__test__";
import AppEditBreadcrumb from "./AppEditBreadcrumb.tsx";
import { dummyApps } from "@__test__/fixtures";

describe("AppEditBreadcrumb", () => {
  it("renders breadcrumb links for the edit flow", () => {
    const project = dummyApps[0]!.details;
    render(<AppEditBreadcrumb project={project} />);

    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: /apps/i })).toHaveAttribute(
      "href",
      "/page/my-projects"
    );
    expect(
      screen.getByRole("link", { name: project.version.app_metadata.name! })
    ).toHaveAttribute("href", `/page/project/${project.slug}`);
    expect(screen.getByText(/edit/i)).toBeInTheDocument();
  });
});
