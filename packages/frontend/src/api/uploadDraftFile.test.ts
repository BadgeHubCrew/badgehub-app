/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadDraftFile } from "./uploadDraftFile.ts";

type XhrInstance = {
  open: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  setRequestHeader: ReturnType<typeof vi.fn>;
  upload: { onprogress: ((event: ProgressEvent) => void) | null };
  onload: (() => void) | null;
  onerror: (() => void) | null;
  onabort: (() => void) | null;
  status: number;
  responseText: string;
};

describe("uploadDraftFile", () => {
  const originalXHR = globalThis.XMLHttpRequest;

  afterEach(() => {
    globalThis.XMLHttpRequest = originalXHR;
    vi.restoreAllMocks();
  });

  function mockXhr() {
    const xhr: XhrInstance = {
      open: vi.fn(),
      send: vi.fn(),
      setRequestHeader: vi.fn(),
      upload: { onprogress: null },
      onload: null,
      onerror: null,
      onabort: null,
      status: 204,
      responseText: "",
    };
    globalThis.XMLHttpRequest = vi.fn(function MockXHR() {
      return xhr;
    }) as unknown as typeof XMLHttpRequest;
    return xhr;
  }

  it("POSTs multipart FormData with auth and reports upload progress", async () => {
    const xhr = mockXhr();
    const onProgress = vi.fn();
    const file = new File(["hello-world"], "main.py", {
      type: "text/x-python",
    });

    const pending = uploadDraftFile({
      slug: "demo-app",
      filePath: "main.py",
      file,
      authorization: "Bearer test-token",
      onProgress,
    });

    expect(xhr.open).toHaveBeenCalledWith(
      "POST",
      expect.stringContaining("/projects/demo-app/draft/files/main.py")
    );
    expect(xhr.setRequestHeader).toHaveBeenCalledWith(
      "Authorization",
      "Bearer test-token"
    );
    expect(xhr.send).toHaveBeenCalledTimes(1);
    const body = xhr.send.mock.calls[0]?.[0];
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("file")).toBe(file);

    xhr.upload.onprogress?.({
      lengthComputable: true,
      loaded: 5,
      total: 11,
    } as ProgressEvent);

    expect(onProgress).toHaveBeenCalledWith({ loaded: 5, total: 11 });

    xhr.status = 204;
    xhr.responseText = "";
    xhr.onload?.();

    await expect(pending).resolves.toMatchObject({
      status: 204,
      body: undefined,
    });
  });

  it("encodes nested file paths in the URL", async () => {
    const xhr = mockXhr();
    const file = new File(["x"], "icon.png", { type: "image/png" });

    const pending = uploadDraftFile({
      slug: "my app",
      filePath: "assets/icon.png",
      file,
      authorization: "Bearer t",
    });

    expect(xhr.open).toHaveBeenCalledWith(
      "POST",
      expect.stringMatching(
        /\/projects\/my%20app\/draft\/files\/assets\/icon\.png$/
      )
    );

    xhr.onload?.();
    await pending;
  });

  it("returns parsed error bodies for non-2xx responses", async () => {
    const xhr = mockXhr();
    const file = new File(["{"], "metadata.json", {
      type: "application/json",
    });

    const pending = uploadDraftFile({
      slug: "demo",
      filePath: "metadata.json",
      file,
      authorization: "Bearer t",
    });

    xhr.status = 400;
    xhr.responseText = JSON.stringify({
      reason: "metadata.json is not valid JSON.",
    });
    xhr.onload?.();

    await expect(pending).resolves.toEqual({
      status: 400,
      body: { reason: "metadata.json is not valid JSON." },
      headers: expect.any(Headers),
    });
  });
});
