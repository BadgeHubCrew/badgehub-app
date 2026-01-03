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
  it("updates badge selection", async () => {
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

    const badgeSearch = screen.getByLabelText(/search badge/i);
    await user.type(badgeSearch, "why");
    expect(screen.queryByLabelText("mch2022")).not.toBeInTheDocument();
    await user.clear(badgeSearch);

    await user.click(screen.getByLabelText("why2025"));
    await user.click(screen.getByLabelText("mch2022"));

    expect(onChange).toHaveBeenLastCalledWith({
      badges: ["why2025", "mch2022"],
    });
  });

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

    const categorySearch = screen.getByLabelText(/search category/i);
    await user.type(categorySearch, "Hard");
    expect(screen.queryByLabelText("Games")).not.toBeInTheDocument();
    await user.clear(categorySearch);

    await user.click(screen.getByLabelText("Games"));
    await user.click(screen.getByLabelText("Hardware"));

    expect(onChange).toHaveBeenLastCalledWith({
      categories: ["Games", "Hardware"],
    });
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
