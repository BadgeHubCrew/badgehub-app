import { fireEvent, render, screen, waitFor } from "@__test__";
import { getAuthorizationHeader, getFreshToken } from "@api/apiClient.ts";
import { uploadDraftFile } from "@api/uploadDraftFile.ts";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppEditFileUpload from "./AppEditFileUpload.tsx";

vi.mock("@api/apiClient.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@api/apiClient.ts")>();
  return {
    ...actual,
    getFreshToken: vi.fn().mockResolvedValue("token"),
    getAuthorizationHeader: vi
      .fn()
      .mockResolvedValue({ authorization: "Bearer token" }),
  };
});

vi.mock("@api/uploadDraftFile.ts", () => ({
  uploadDraftFile: vi.fn(),
}));

const keycloak = {
  updateToken: vi.fn().mockResolvedValue(true),
  token: "token",
} as unknown as import("keycloak-js").default;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getFreshToken).mockResolvedValue("token");
  vi.mocked(getAuthorizationHeader).mockResolvedValue({
    authorization: "Bearer token",
  });
});

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
    vi.mocked(uploadDraftFile).mockResolvedValue({
      status: 204,
      body: undefined,
      headers: new Headers(),
    });

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

    expect(uploadDraftFile).toHaveBeenCalledTimes(2);
    expect(getAuthorizationHeader).toHaveBeenCalled();
    expect(getFreshToken).toHaveBeenCalled();
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
    vi.mocked(uploadDraftFile).mockResolvedValue({
      status: 400,
      body: { reason: "metadata.json is not valid JSON." },
      headers: new Headers(),
    });

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

  it("updates the progress bar from XHR upload progress events", async () => {
    const user = userEvent.setup();
    const onUploadSuccess = vi.fn();
    const first = deferred<{
      status: number;
      body: undefined;
      headers: Headers;
    }>();

    vi.mocked(uploadDraftFile).mockImplementationOnce((options) => {
      options.onProgress?.({ loaded: 50, total: 100 });
      return first.promise;
    });

    render(
      <AppEditFileUpload
        slug="demo"
        keycloak={keycloak}
        onUploadSuccess={onUploadSuccess}
      />
    );

    const fileInput = screen.getByTestId("app-edit-file-upload-input");
    // 100-byte file so mid-upload progress is easy to assert
    const fileA = new File([new Uint8Array(100)], "a.py", {
      type: "text/x-python",
    });

    await user.upload(fileInput, [fileA]);

    const bar = await screen.findByTestId("app-edit-file-upload-progress");
    expect(bar).toHaveAttribute("value", "50");
    expect(bar).toHaveAttribute("max", "100");
    expect(
      screen.getByText(/uploading 1 of 1: a\.py \(50%\)/i)
    ).toBeInTheDocument();

    first.resolve({
      status: 204,
      body: undefined,
      headers: new Headers(),
    });

    expect(await screen.findByText(/uploaded a\.py/i)).toBeInTheDocument();
    expect(onUploadSuccess).toHaveBeenCalled();
  });

  it("shows multi-file progress while the first upload is in flight", async () => {
    const user = userEvent.setup();
    const onUploadSuccess = vi.fn();
    const first = deferred<{
      status: number;
      body: undefined;
      headers: Headers;
    }>();
    let call = 0;

    vi.mocked(uploadDraftFile).mockImplementation((options) => {
      call += 1;
      if (call === 1) {
        options.onProgress?.({ loaded: 25, total: 100 });
        return first.promise;
      }
      return Promise.resolve({
        status: 204,
        body: undefined,
        headers: new Headers(),
      });
    });

    render(
      <AppEditFileUpload
        slug="demo"
        keycloak={keycloak}
        onUploadSuccess={onUploadSuccess}
      />
    );

    const fileInput = screen.getByTestId("app-edit-file-upload-input");
    const fileA = new File([new Uint8Array(100)], "a.py", {
      type: "text/x-python",
    });
    const fileB = new File([new Uint8Array(100)], "b.py", {
      type: "text/x-python",
    });

    await user.upload(fileInput, [fileA, fileB]);

    const bar = await screen.findByTestId("app-edit-file-upload-progress");
    // 25% of first 100-byte file → 25 / 200 overall
    expect(bar).toHaveAttribute("value", "25");
    expect(bar).toHaveAttribute("max", "200");
    expect(
      screen.getByText(/uploading 1 of 2: a\.py \(13%\)/i)
    ).toBeInTheDocument();

    first.resolve({
      status: 204,
      body: undefined,
      headers: new Headers(),
    });

    expect(
      await screen.findByText(/uploaded 2 files: a\.py, b\.py/i)
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(uploadDraftFile).toHaveBeenCalledTimes(2);
    });
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
    vi.mocked(uploadDraftFile).mockResolvedValue({
      status: 204,
      body: undefined,
      headers: new Headers(),
    });

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
    expect(uploadDraftFile).toHaveBeenCalledTimes(1);
    expect(onUploadSuccess).toHaveBeenCalledWith({
      metadataChanged: false,
      firstValidExecutable: "main.py",
      uploadedPaths: ["main.py"],
    });
  });
});
