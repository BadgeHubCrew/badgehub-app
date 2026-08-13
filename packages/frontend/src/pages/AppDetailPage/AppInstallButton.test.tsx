import type { ApiClient } from "@api/apiClient.ts";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppInstallButton from "./AppInstallButton.tsx";

const { installMpkWebSerial } = vi.hoisted(() => ({
  installMpkWebSerial: vi.fn(),
}));

vi.mock("mpk-installer?module", () => ({ installMpkWebSerial }));

describe("AppInstallButton", () => {
  const originalSerial = Object.getOwnPropertyDescriptor(navigator, "serial");

  beforeEach(() => {
    installMpkWebSerial.mockReset();
  });

  afterEach(() => {
    if (originalSerial) {
      Object.defineProperty(navigator, "serial", originalSerial);
    } else {
      Reflect.deleteProperty(navigator, "serial");
    }
  });

  it("does not report an installation when device selection is cancelled", async () => {
    installMpkWebSerial.mockRejectedValue(
      new DOMException("No port selected", "NotFoundError")
    );
    const reportInstall = vi.fn();
    const apiClient = { reportInstall } as unknown as ApiClient;
    const user = userEvent.setup();

    render(
      <AppInstallButton
        apiClient={apiClient}
        mpkUrl="https://example.com/app.mpk"
        revision={3}
        slug="example-app"
      />
    );
    await user.click(screen.getByRole("button", { name: "Install on badge" }));

    expect(await screen.findByText("No device was selected.")).toBeVisible();
    expect(reportInstall).not.toHaveBeenCalled();
  });

  it.each([
    "Device did not enter MicroPython raw REPL:",
    "Timed out waiting for the badge",
    "Timed out waiting for a raw-REPL response",
  ])("retries the transient serial error once: %s", async (errorMessage) => {
    const port = { name: "test port" };
    const getPorts = vi.fn().mockResolvedValue([port]);
    Object.defineProperty(navigator, "serial", {
      configurable: true,
      value: { getPorts },
    });
    installMpkWebSerial
      .mockRejectedValueOnce(new Error(errorMessage))
      .mockImplementationOnce(async (_url, options) => {
        options.onProgress({
          phase: "uploading",
          progress: 0.5,
          fileIndex: 1,
          fileCount: 2,
          totalBytes: 100,
        });
        return {
          installed: true,
          overwritten: false,
          appId: "be.example.app",
          location: "/apps/be.example.app",
        };
      });
    const reportInstall = vi.fn().mockResolvedValue({ status: 204 });
    const apiClient = { reportInstall } as unknown as ApiClient;
    const user = userEvent.setup();

    render(
      <AppInstallButton
        apiClient={apiClient}
        mpkUrl="https://example.com/app.mpk"
        revision={3}
        slug="example-app"
      />
    );
    await user.click(screen.getByRole("button", { name: "Install on badge" }));

    expect(await screen.findByText("Installed be.example.app.")).toBeVisible();
    expect(getPorts).toHaveBeenCalledOnce();
    expect(installMpkWebSerial).toHaveBeenCalledTimes(2);
    expect(installMpkWebSerial).toHaveBeenLastCalledWith(
      "https://example.com/app.mpk",
      expect.objectContaining({ port })
    );
    expect(reportInstall).toHaveBeenCalledOnce();
  });

  it("updates the status text when installation progress changes", async () => {
    let finishInstall: ((result: unknown) => void) | undefined;
    installMpkWebSerial.mockImplementation(
      async (
        _url: string,
        options?: {
          onProgress?: (progress: {
            phase: string;
            progress: number;
            fileIndex?: number;
            fileCount?: number;
            totalBytes: number;
          }) => void;
        }
      ) => {
        options?.onProgress?.({
          phase: "uploading",
          progress: 0.5,
          fileIndex: 2,
          fileCount: 4,
          totalBytes: 100,
        });
        return await new Promise((resolve) => {
          finishInstall = resolve;
        });
      }
    );
    const apiClient = { reportInstall: vi.fn() } as unknown as ApiClient;
    const user = userEvent.setup();

    render(
      <AppInstallButton
        apiClient={apiClient}
        mpkUrl="https://example.com/app.mpk"
        revision={3}
        slug="example-app"
      />
    );
    await user.click(screen.getByRole("button", { name: "Install on badge" }));

    expect(await screen.findByText("Installing files (2/4)…")).toBeVisible();
    expect(screen.getByText("50%")).toBeVisible();

    finishInstall?.({
      installed: false,
      overwritten: false,
      appId: "be.example.app",
      location: "/apps/be.example.app",
    });
  });
});
