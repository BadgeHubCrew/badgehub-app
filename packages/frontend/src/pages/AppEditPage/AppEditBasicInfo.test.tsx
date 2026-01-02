import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@__test__";
import userEvent from "@testing-library/user-event";
import AppEditBasicInfo from "./AppEditBasicInfo.tsx";
import type { ProjectEditFormData } from "./ProjectEditFormData.ts";

const baseForm: ProjectEditFormData = {
  name: "Demo",
  author: "Author",
  description: "Desc",
  git_url: "https://github.com/demo/repo",
  hidden: false,
};

describe("AppEditBasicInfo", () => {
  it("renders form fields with provided values", () => {
    render(<AppEditBasicInfo form={baseForm} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/app name/i)).toHaveValue("Demo");
    expect(screen.getByLabelText(/author/i)).toHaveValue("Author");
    expect(screen.getByLabelText(/git url/i)).toHaveValue(
      "https://github.com/demo/repo"
    );
    expect(screen.getByLabelText(/description/i)).toHaveValue("Desc");
    expect(screen.getByLabelText(/hidden/i)).not.toBeChecked();
  });

  it("calls onChange for updated fields", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AppEditBasicInfo form={baseForm} onChange={onChange} />);

    await user.clear(screen.getByLabelText(/app name/i));
    await user.type(screen.getByLabelText(/app name/i), "New Name");
    expect(onChange).toHaveBeenCalledWith({ name: "New Name" });

    await user.clear(screen.getByLabelText(/author/i));
    await user.type(screen.getByLabelText(/author/i), "New Author");
    expect(onChange).toHaveBeenCalledWith({ author: "New Author" });

    await user.clear(screen.getByLabelText(/git url/i));
    await user.type(
      screen.getByLabelText(/git url/i),
      "https://gitlab.com/demo/repo"
    );
    expect(onChange).toHaveBeenCalledWith({
      git_url: "https://gitlab.com/demo/repo",
    });

    await user.clear(screen.getByLabelText(/description/i));
    await user.type(screen.getByLabelText(/description/i), "New Desc");
    expect(onChange).toHaveBeenCalledWith({ description: "New Desc" });

    await user.click(screen.getByLabelText(/hidden/i));
    expect(onChange).toHaveBeenCalledWith({ hidden: true });
  });
});
