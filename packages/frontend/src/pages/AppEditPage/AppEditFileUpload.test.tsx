import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@__test__";
import userEvent from "@testing-library/user-event";
import AppEditFileUpload from "./AppEditFileUpload.tsx";
import { getFreshAuthorizedTsRestClient } from "@api/tsRestClient.ts";

vi.mock("@api/tsRestClient.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@api/tsRestClient.ts")>();
  return {
    ...actual,
    getFreshAuthorizedTsRestClient: vi.fn(),
  };
});

const keycloak = {
  updateToken: vi.fn().mockResolvedValue(true),
} as any;

describe("AppEditFileUpload", () => {
  it("uploads files and reports success", async () => {
    const user = userEvent.setup();
    const onUploadSuccess = vi.fn();
    const writeDraftFile = vi.fn().mockResolvedValue({ status: 204 });
    vi.mocked(getFreshAuthorizedTsRestClient).mockResolvedValue({
      writeDraftFile,
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedTsRestClient>>);

    render(
      <AppEditFileUpload
        slug="demo"
        keycloak={keycloak}
        onUploadSuccess={onUploadSuccess}
      />
    );

    const fileInput = screen.getByTestId("app-edit-file-upload-input");
    const executable = new File(["print('ok')"], "main.py", {
      type: "text/x-python",
    });
    const metadata = new File(["{}"], "metadata.json", {
      type: "application/json",
    });

    await user.upload(fileInput, [executable, metadata]);

    expect(writeDraftFile).toHaveBeenCalledTimes(2);
    expect(onUploadSuccess).toHaveBeenCalledWith({
      metadataChanged: true,
      firstValidExecutable: "main.py",
    });
    expect(
      await screen.findByText(/uploaded successfully/i)
    ).toBeInTheDocument();
  });

  it("shows an error when upload fails", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const onUploadSuccess = vi.fn();
    const writeDraftFile = vi.fn().mockResolvedValue({ status: 500 });
    vi.mocked(getFreshAuthorizedTsRestClient).mockResolvedValue({
      writeDraftFile,
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedTsRestClient>>);

    render(
      <AppEditFileUpload
        slug="demo"
        keycloak={keycloak}
        onUploadSuccess={onUploadSuccess}
      />
    );

    const fileInput = screen.getByTestId("app-edit-file-upload-input");
    const executable = new File(["print('ok')"], "main.py", {
      type: "text/x-python",
    });

    await user.upload(fileInput, [executable]);

    expect(
      await screen.findByText(/upload failed for main.py/i)
    ).toBeInTheDocument();
    expect(onUploadSuccess).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
