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
  size: 12,
  size_formatted: "12 B",
  mimetype: "text/x-python",
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

  it("shows and triggers icon action for valid 64x64 pngs", async () => {
    const user = userEvent.setup();
    const onSetIcon = vi.fn();
    const file = {
      ...baseFile,
      full_path: "icon.png",
      ext: "png",
      mimetype: "image/png",
      image_width: 64,
      image_height: 64,
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
    expect(onSetIcon).toHaveBeenCalledWith("64x64", "icon.png");
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

    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:demo");
    const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL");
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");

    render(
      <FileListItem file={baseFile} slug="demo" keycloak={keycloak} />
    );

    await user.click(screen.getByTitle("Download draft file"));

    expect(getDraftFile).toHaveBeenCalledWith({
      params: { slug: "demo", filePath: "main.py" },
    });
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});
