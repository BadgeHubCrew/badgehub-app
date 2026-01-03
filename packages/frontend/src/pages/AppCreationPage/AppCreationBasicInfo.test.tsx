import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@__test__";
import AppCreationBasicInfo from "./AppCreationBasicInfo.tsx";

describe("AppCreationBasicInfo", () => {
  it("sanitizes slug input", async () => {
    const onChange = vi.fn();
    render(<AppCreationBasicInfo form={{ slug: "" }} onChange={onChange} />);
    const input = screen.getByTestId("app-creation-slug-input");

    fireEvent.change(input, { target: { value: "1abc-DEF" } });
    expect(onChange).toHaveBeenLastCalledWith({ slug: "abc" });
  });
});
