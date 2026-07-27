import { fireEvent, render, screen } from "@__test__";
import { getFreshAuthorizedApiClient } from "@api/apiClient.ts";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AppEditFileUpload from "./AppEditFileUpload.tsx";

vi.mock("@api/apiClient.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@api/apiClient.ts")>();
  return {
    ...actual,
    getFreshAuthorizedApiClient: vi.fn(),
  };
});

const keycloak = {
  updateToken: vi.fn().mockResolvedValue(true),
} as unknown as import("keycloak-js").default;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function dropFiles(target: Element, files: File[]) {
  fireEvent.dragEnter(target, {
    dataTransfer: { files, types: ["Files"] },
  });
  fireEvent.dragOver(target, {
    dataTransfer: { files, types: ["Files"], dropEffect: "copy" },
  });
  fireEvent.drop(target, {
    dataTransfer: { files, types: ["Files"] },
  });
}

describe("AppEditFileUpload", () => {
  it("uploads files and reports success with file names", async () => {
    const user = userEvent.setup();
    const onUploadSuccess = vi.fn();
    const writeDraftFile = vi.fn().mockResolvedValue({ status: 204 });
    vi.mocked(getFreshAuthorizedApiClient).mockResolvedValue({
      writeDraftFile,
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedApiClient>>);

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
      uploadedPaths: ["main.py", "metadata.json"],
    });
    expect(
      await screen.findByText(/uploaded 2 files: main\.py, metadata\.json/i)
    ).toBeInTheDocument();
  });

  it("shows an error when upload fails", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const onUploadSuccess = vi.fn();
    const writeDraftFile = vi.fn().mockResolvedValue({
      status: 400,
      body: { reason: "metadata.json is not valid JSON." },
    });
    vi.mocked(getFreshAuthorizedApiClient).mockResolvedValue({
      writeDraftFile,
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedApiClient>>);

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

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      /upload failed for main\.py: metadata\.json is not valid JSON\./i
    );
    expect(onUploadSuccess).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("shows progress while uploading multiple files", async () => {
    const user = userEvent.setup();
    const onUploadSuccess = vi.fn();
    const first = deferred<{ status: number }>();
    const writeDraftFile = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce({ status: 204 });

    vi.mocked(getFreshAuthorizedApiClient).mockResolvedValue({
      writeDraftFile,
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedApiClient>>);

    render(
      <AppEditFileUpload
        slug="demo"
        keycloak={keycloak}
        onUploadSuccess={onUploadSuccess}
      />
    );

    const fileInput = screen.getByTestId("app-edit-file-upload-input");
    const fileA = new File(["a"], "a.py", { type: "text/x-python" });
    const fileB = new File(["b"], "b.py", { type: "text/x-python" });

    await user.upload(fileInput, [fileA, fileB]);

    expect(
      await screen.findByText(/uploading 1 of 2: a\.py/i)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("app-edit-file-upload-progress")
    ).toBeInTheDocument();

    first.resolve({ status: 204 });

    expect(
      await screen.findByText(/uploaded 2 files: a\.py, b\.py/i)
    ).toBeInTheDocument();
    expect(writeDraftFile).toHaveBeenCalledTimes(2);
    expect(onUploadSuccess).toHaveBeenCalled();
  });

  it("highlights the drop zone while dragging files", () => {
    render(
      <AppEditFileUpload
        slug="demo"
        keycloak={keycloak}
        onUploadSuccess={vi.fn()}
      />
    );

    const zone = screen.getByTestId("app-edit-file-dropzone");
    expect(zone).toHaveAttribute("data-dragging", "false");

    fireEvent.dragEnter(zone, {
      dataTransfer: { types: ["Files"], files: [] },
    });

    expect(zone).toHaveAttribute("data-dragging", "true");
    expect(screen.getByText(/drop to upload/i)).toBeInTheDocument();
  });

  it("uploads files dropped on the zone", async () => {
    const onUploadSuccess = vi.fn();
    const writeDraftFile = vi.fn().mockResolvedValue({ status: 204 });
    vi.mocked(getFreshAuthorizedApiClient).mockResolvedValue({
      writeDraftFile,
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedApiClient>>);

    render(
      <AppEditFileUpload
        slug="demo"
        keycloak={keycloak}
        onUploadSuccess={onUploadSuccess}
      />
    );

    const zone = screen.getByTestId("app-edit-file-dropzone");
    const file = new File(["print('ok')"], "main.py", {
      type: "text/x-python",
    });

    dropFiles(zone, [file]);

    expect(await screen.findByText(/uploaded main\.py/i)).toBeInTheDocument();
    expect(writeDraftFile).toHaveBeenCalledTimes(1);
    expect(onUploadSuccess).toHaveBeenCalledWith({
      metadataChanged: false,
      firstValidExecutable: "main.py",
      uploadedPaths: ["main.py"],
    });
  });
});
