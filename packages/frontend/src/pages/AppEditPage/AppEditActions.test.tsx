import { render, screen, within } from "@__test__";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AppEditActions from "./AppEditActions.tsx";

describe("AppEditActions", () => {
  it("renders project actions and cancel link", () => {
    render(
      <AppEditActions
        onClickDeleteApplication={vi.fn()}
        workInProgress={false}
        onWorkInProgressChange={vi.fn()}
      />
    );

    expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute(
      "href",
      "/"
    );
    expect(
      screen.getByRole("button", { name: /delete application/i })
    ).toBeInTheDocument();
  });

  it("only invokes the delete handler after confirmation", async () => {
    const user = userEvent.setup();
    const onClickDeleteApplication = vi.fn();
    render(
      <AppEditActions
        onClickDeleteApplication={onClickDeleteApplication}
        workInProgress={false}
        onWorkInProgressChange={vi.fn()}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /delete application/i })
    );

    const dialog = screen.getByRole("dialog", {
      name: "Delete this application?",
    });
    expect(onClickDeleteApplication).not.toHaveBeenCalled();

    await user.click(
      within(dialog).getByRole("button", { name: "Keep application" })
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onClickDeleteApplication).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: /delete application/i })
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete application",
      })
    );

    expect(onClickDeleteApplication).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("invokes status change handler when toggled", async () => {
    const user = userEvent.setup();
    const onWorkInProgressChange = vi.fn();
    render(
      <AppEditActions
        onClickDeleteApplication={vi.fn()}
        workInProgress={false}
        onWorkInProgressChange={onWorkInProgressChange}
      />
    );

    await user.click(
      screen.getByRole("checkbox", { name: /work in progress/i })
    );

    expect(onWorkInProgressChange).toHaveBeenCalledWith(true);
  });
});
