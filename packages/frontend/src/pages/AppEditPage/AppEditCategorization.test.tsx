import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@__test__";
import userEvent from "@testing-library/user-event";
import AppEditCategorization from "./AppEditCategorization.tsx";
import type { ProjectEditFormData } from "./ProjectEditFormData.ts";

const baseForm: ProjectEditFormData = {
  categories: undefined,
  license_file: "",
};

describe("AppEditCategorization", () => {
  it("updates category selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const Wrapper = () => {
      const [form, setForm] = useState<ProjectEditFormData>(baseForm);
      const handleChange = (changes: Partial<ProjectEditFormData>) => {
        onChange(changes);
        setForm((prev) => ({ ...prev, ...changes }));
      };
      return <AppEditCategorization form={form} onChange={handleChange} />;
    };

    render(<Wrapper />);

    const categorySelect = screen.getByTestId("category-dropdown");
    await user.selectOptions(categorySelect, "Games");

    expect(categorySelect).toHaveValue("Games");
    expect(onChange).toHaveBeenLastCalledWith({ categories: ["Games"] });
  });

  it("updates license field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const Wrapper = () => {
      const [form, setForm] = useState<ProjectEditFormData>(baseForm);
      const handleChange = (changes: Partial<ProjectEditFormData>) => {
        onChange(changes);
        setForm((prev) => ({ ...prev, ...changes }));
      };
      return <AppEditCategorization form={form} onChange={handleChange} />;
    };

    render(<Wrapper />);

    const licenseInput = screen.getByRole("textbox");
    await user.type(licenseInput, "LICENSE.txt");

    expect(licenseInput).toHaveValue("LICENSE.txt");
    expect(onChange).toHaveBeenLastCalledWith({
      license_file: "LICENSE.txt",
    });
  });
});
