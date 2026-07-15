import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAsyncResource } from "./useAsyncResource.ts";

describe("useAsyncResource", () => {
  it("loads once when deps are stable (does not loop on re-render)", async () => {
    const loader = vi.fn(async () => "ok");

    const { result, rerender } = renderHook(
      ({ id }) =>
        useAsyncResource(async () => loader(), [id], {
          enabled: true,
        }),
      { initialProps: { id: "a" } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toBe("ok");
    expect(loader).toHaveBeenCalledTimes(1);

    // Parent re-renders with same deps — must not re-fetch.
    rerender({ id: "a" });
    rerender({ id: "a" });
    await act(async () => {
      await Promise.resolve();
    });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("re-fetches when deps change", async () => {
    const loader = vi.fn(async (id: string) => id);

    const { result, rerender } = renderHook(
      ({ id }) => useAsyncResource(async () => loader(id), [id]),
      { initialProps: { id: "a" } }
    );

    await waitFor(() => expect(result.current.data).toBe("a"));
    expect(loader).toHaveBeenCalledTimes(1);

    rerender({ id: "b" });
    await waitFor(() => expect(result.current.data).toBe("b"));
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("re-fetches when reload() is called", async () => {
    const loader = vi.fn(async () => "ok");

    const { result } = renderHook(() =>
      useAsyncResource(async () => loader(), [])
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(loader).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.reload();
    });
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  });
});
