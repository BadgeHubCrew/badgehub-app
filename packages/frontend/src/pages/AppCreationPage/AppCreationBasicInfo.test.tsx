import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@__test__";
import AppCreationBasicInfo from "./AppCreationBasicInfo.tsx";

describe("AppCreationBasicInfo", () => {
  it("wires the slug input pattern and change handler", () => {
    const onChange = vi.fn();
    render(<AppCreationBasicInfo form={{ slug: "" }} onChange={onChange} />);
    const input = screen.getByTestId("app-creation-slug-input");

    expect(input).toHaveAttribute("pattern");

    fireEvent.change(input, { target: { value: "demo_app" } });
    expect(onChange).toHaveBeenLastCalledWith({ slug: "demo_app" });
  });
});
