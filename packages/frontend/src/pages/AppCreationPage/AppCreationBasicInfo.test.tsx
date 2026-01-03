import React, { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@__test__";
import userEvent from "@testing-library/user-event";
import AppCreationBasicInfo from "./AppCreationBasicInfo.tsx";
import type { AppCreationFormData } from "./AppCreationPage.tsx";

describe("AppCreationBasicInfo", () => {
  it("sanitizes slug input", async () => {
    const user = userEvent.setup();
    const Wrapper = () => {
      const [form, setForm] = useState<AppCreationFormData>({ slug: "" });
      return (
        <AppCreationBasicInfo
          form={form}
          onChange={(changes) =>
            setForm((prev) => ({ ...prev, ...changes }))
          }
        />
      );
    };

    render(<Wrapper />);
    const input = screen.getByTestId("app-creation-slug-input");

    await user.type(input, "1abc-DEF");
    expect(input).toHaveValue("abc");
  });
});
