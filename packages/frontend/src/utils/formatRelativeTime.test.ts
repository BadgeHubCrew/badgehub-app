import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./formatRelativeTime.ts";

const now = new Date("2026-01-01T12:00:00.000Z");

describe("formatRelativeTime", () => {
  it.each([
    [0, "just now"],
    [30_000, "just now"],
    [60_000, "1 minute ago"],
    [120_000, "2 minutes ago"],
    [3_600_000, "1 hour ago"],
    [7_200_000, "2 hours ago"],
    [86_400_000, "1 day ago"],
    [172_800_000, "2 days ago"],
  ] as const)("formats %i ms ago as %s", (agoMs, label) => {
    const then = new Date(now.getTime() - agoMs).toISOString();
    expect(formatRelativeTime(then, now)).toBe(label);
  });

  it("falls back to locale date for older timestamps", () => {
    const then = new Date(now.getTime() - 60 * 86_400_000).toISOString();
    expect(formatRelativeTime(then, now)).toBe(
      new Date(then).toLocaleDateString()
    );
  });

  it("returns the original string for invalid dates", () => {
    expect(formatRelativeTime("not-a-date", now)).toBe("not-a-date");
  });
});
