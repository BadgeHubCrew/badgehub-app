import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@__test__";
import userEvent from "@testing-library/user-event";
import AppEditActions from "./AppEditActions.tsx";

describe("AppEditActions", () => {
  it("renders action buttons and cancel link", () => {
    render(<AppEditActions onClickDeleteApplication={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /save & publish/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /cancel/i })
    ).toHaveAttribute("href", "..");
    expect(
      screen.getByRole("button", { name: /delete application/i })
    ).toBeInTheDocument();
  });

  it("invokes delete handler when clicked", async () => {
    const user = userEvent.setup();
    const onClickDeleteApplication = vi.fn();
    render(<AppEditActions onClickDeleteApplication={onClickDeleteApplication} />);

    await user.click(
      screen.getByRole("button", { name: /delete application/i })
    );

    expect(onClickDeleteApplication).toHaveBeenCalled();
  });
});
