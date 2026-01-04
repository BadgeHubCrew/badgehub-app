import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@__test__";
import userEvent from "@testing-library/user-event";
import { FileListItem } from "./FileListItem.tsx";
import type { FileMetadata } from "@shared/domain/readModels/project/FileMetadata.ts";
import { getFreshAuthorizedTsRestClient } from "@api/tsRestClient.ts";

vi.mock("@api/tsRestClient.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@api/tsRestClient.ts")>();
  return {
    ...actual,
    getFreshAuthorizedTsRestClient: vi.fn(),
  };
});

const keycloak = { updateToken: vi.fn().mockResolvedValue(true) } as any;

const baseFile: FileMetadata = {
  full_path: "main.py",
  name: "main",
  ext: "py",
  size_formatted: "5 KB",
  mimetype: "text/x-python",
  size_of_content: 5000,
  sha256: "e".repeat(64),
  url: "http://badgehub.p1m.nl/main.py",
  dir: "",
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
};

describe("FileListItem", () => {
  it("renders delete button disabled for metadata.json", () => {
    const file = { ...baseFile, full_path: "metadata.json", ext: "json" };
    const onDeleteFile = vi.fn();
    render(
      <FileListItem
        file={file}
        slug="demo"
        keycloak={keycloak}
        onDeleteFile={onDeleteFile}
      />
    );

    const deleteButton = screen.getByTitle("This file cannot be deleted");
    expect(deleteButton).toBeDisabled();
  });

  it("calls onSetMainExecutable for executable files", async () => {
    const user = userEvent.setup();
    const onSetMainExecutable = vi.fn();
    render(
      <FileListItem
        file={baseFile}
        slug="demo"
        keycloak={keycloak}
        onSetMainExecutable={onSetMainExecutable}
      />
    );

    await user.click(screen.getByText("Set as Main"));
    expect(onSetMainExecutable).toHaveBeenCalledWith("main.py");
  });

  it("shows and triggers icon action for image files", async () => {
    const user = userEvent.setup();
    const onSetIcon = vi.fn();
    const file = {
      ...baseFile,
      full_path: "icon.png",
      ext: "png",
      mimetype: "image/png",
      image_width: 24,
      image_height: 24,
    };

    render(
      <FileListItem
        file={file}
        slug="demo"
        keycloak={keycloak}
        onSetIcon={onSetIcon}
      />
    );

    await user.click(screen.getByText("Set as Icon"));
    expect(onSetIcon).toHaveBeenCalledWith("icon.png");
  });

  it("downloads draft file on download button click", async () => {
    const user = userEvent.setup();
    const getDraftFile = vi.fn().mockResolvedValue({
      status: 200,
      body: new Blob(["test"], { type: "text/plain" }),
    });
    vi.mocked(getFreshAuthorizedTsRestClient).mockResolvedValue({
      getDraftFile,
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedTsRestClient>>);

    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const createObjectURLMock = vi.fn().mockReturnValue("blob:demo");
    const revokeObjectURLMock = vi.fn();

    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: createObjectURLMock,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: revokeObjectURLMock,
    });
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");
    const originalAnchorClick = HTMLAnchorElement.prototype.click;
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(<FileListItem file={baseFile} slug="demo" keycloak={keycloak} />);

    await user.click(screen.getByTitle("Download draft file"));

    expect(getDraftFile).toHaveBeenCalledWith({
      params: { slug: "demo", filePath: "main.py" },
    });
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();

    anchorClickSpy.mockRestore();
    HTMLAnchorElement.prototype.click = originalAnchorClick;
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: originalCreateObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: originalRevokeObjectURL,
    });
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});
