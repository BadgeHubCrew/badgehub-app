import {
  ProjectDetails,
  ProjectSlug,
} from "@shared/domain/readModels/project/ProjectDetails";
import {
  LatestOrDraftAlias,
  RevisionNumberOrAlias,
} from "@shared/domain/readModels/project/Version";
import { User } from "@shared/domain/readModels/project/User";
import { FileMetadata } from "@shared/domain/readModels/project/FileMetadata";
import { BadgeSlug } from "@shared/domain/readModels/Badge";
import {
  CategoryName,
  isAdminCategory,
} from "@shared/domain/readModels/project/Category";
import { DBProject } from "@db/models/project/DBProject";
import { BadgeHubFiles } from "@domain/BadgeHubFiles";
import { UploadedFile } from "@shared/domain/UploadedFile";
import { DBDatedData } from "@db/models/project/DBDatedData";
import { stringToSha256, uint8ToSha256 } from "@util/sha256";
import { TimestampTZ } from "@db/models/DBTypes";
import { CreateProjectProps } from "@shared/domain/writeModels/project/WriteProject";
import { WriteAppMetadataJSON } from "@shared/domain/writeModels/AppMetadataJSON";
import { LRUCache } from "lru-cache";
import {
  appMetadataJSONSchema,
  IconSize,
} from "@shared/domain/readModels/project/AppMetadataJSON";
import { BadgeHubMetadataStore } from "@domain/BadgeHubMetadataStore";
import { createIconBuffer, getImageProps } from "@util/imageProcessing";
import { UserError } from "@domain/UserError";
import { randomBytes } from "node:crypto";
import { BadgeHubStats } from "@shared/domain/readModels/BadgeHubStats";
import { ProjectSummary } from "@shared/domain/readModels/project/ProjectSummaries";
import { OrderByOption } from "@shared/domain/readModels/project/ordering";
import { parseIconSize } from "@domain/ImageDimensions";

type FileContext =
  | { projectSlug: string; revision: number; filePath: string }
  | { sha256: string };

export class BadgeHubData {
  private immutableFileCache: LRUCache<
    string,
    Uint8Array<ArrayBufferLike>,
    FileContext
  >;
  private latestProjectCache: LRUCache<
    string,
    ProjectDetails,
    {
      projectSlug: string;
      versionRevision: RevisionNumberOrAlias;
    }
  >;
  private immutableProjectCache: LRUCache<
    string,
    ProjectDetails,
    {
      projectSlug: string;
      versionRevision: RevisionNumberOrAlias;
    }
  >;

  private statsCache: LRUCache<string, BadgeHubStats, void>;

  constructor(
    private badgeHubMetadata: BadgeHubMetadataStore,
    private badgeHubFiles: BadgeHubFiles
  ) {
    this.immutableFileCache = new LRUCache({
      max: 1000,
      // for use with tracking overall storage size
      maxSize: 500_000_000, // 500MB
      sizeCalculation: (value, key) => {
        return value.length;
      },
      // how long to live in ms
      ttl: 60_000 * 60 * 12, // 12 hours
      allowStale: true,
      // async method to use for cache.fetch(), for
      // stale-while-revalidate type of behavior
      fetchMethod: async (_key, _staleValue, { context }) => {
        if ("sha256" in context) {
          return this.badgeHubFiles.getFileContents(context.sha256);
        }
        return this._getFileContents(
          context.projectSlug,
          context.revision,
          context.filePath
        );
      },
    });
    this.latestProjectCache = new LRUCache({
      max: 1000,
      ttl: 1000,
      allowStale: true,
      fetchMethod: (_key, _staleValue, { context }) => {
        return this.badgeHubMetadata.getProject(
          context.projectSlug,
          context.versionRevision
        );
      },
    });
    this.immutableProjectCache = new LRUCache({
      max: 1000,
      ttl: 60_000 * 60 * 12,
      allowStale: true,
      fetchMethod: (_key, _staleValue, { context }) => {
        return this.badgeHubMetadata.getProject(
          context.projectSlug,
          context.versionRevision
        );
      },
    });
    this.statsCache = new LRUCache({
      max: 1,
      ttl: 5 * 60_000,
      allowStale: true,
      fetchMethod: () => {
        return this.badgeHubMetadata.getStats();
      },
    });
  }

  insertProject(
    project: CreateProjectProps,
    mockDates?: DBDatedData
  ): Promise<void> {
    return this.badgeHubMetadata.insertProject(project, mockDates);
  }

  updateProject(
    projectSlug: ProjectSlug,
    changes: Partial<Omit<DBProject, "slug">>
  ): Promise<void> {
    return this.badgeHubMetadata.updateProject(projectSlug, changes);
  }

  deleteProject(projectSlug: ProjectSlug): Promise<void> {
    return this.badgeHubMetadata.deleteProject(projectSlug);
  }

  // Publishes the current state of the project as a version
  publishVersion(
    projectSlug: ProjectSlug,
    mockDate?: TimestampTZ
  ): Promise<void> {
    return this.badgeHubMetadata.publishVersion(projectSlug, mockDate);
  }

  async getProject(
    projectSlug: ProjectSlug,
    versionRevision: RevisionNumberOrAlias
  ): Promise<undefined | ProjectDetails> {
    const cacheKey = projectSlug + "_" + versionRevision;
    if (typeof versionRevision === "number") {
      const result = await this.immutableProjectCache.fetch(cacheKey, {
        context: {
          projectSlug,
          versionRevision,
        },
      });
      if (!result) {
        this.immutableProjectCache.delete(cacheKey);
      }
      return result;
    } else if (versionRevision === "latest") {
      const result = await this.latestProjectCache.fetch(cacheKey, {
        context: {
          projectSlug,
          versionRevision,
        },
      });
      if (!result) {
        this.latestProjectCache.delete(cacheKey);
      }
      return result;
    }
    return this.badgeHubMetadata.getProject(projectSlug, versionRevision);
  }

  async getFileContents(
    projectSlug: ProjectSlug,
    versionRevision: RevisionNumberOrAlias,
    filePath: FileMetadata["name"]
  ): Promise<Uint8Array | undefined> {
    if (typeof versionRevision === "number") {
      const cacheKey = projectSlug + "_rev" + versionRevision + ":" + filePath;
      const fileData = await this.immutableFileCache.fetch(cacheKey, {
        context: {
          projectSlug,
          revision: versionRevision,
          filePath,
        },
      });
      if (!fileData) {
        this.immutableFileCache.delete(cacheKey);
      }
      return fileData;
    }
    return await this._getFileContents(projectSlug, versionRevision, filePath);
  }

  private async _getFileContents(
    projectSlug: string,
    versionRevision: RevisionNumberOrAlias,
    filePath: string
  ) {
    const fileMetadata = await this.getFileMetadata(
      projectSlug,
      versionRevision,
      filePath
    );
    if (!fileMetadata) {
      return undefined;
    }
    const sha256 = fileMetadata.sha256;
    return this.getFileContentsBySha256(sha256);
  }

  async getFileContentsBySha256(
    sha256: string
  ): Promise<Uint8Array | undefined> {
    const fileData = await this.immutableFileCache.fetch(sha256, {
      context: { sha256 },
    });
    if (!fileData) {
      this.immutableFileCache.delete(sha256);
    }
    return fileData;
  }

  getVersionZipContents(
    projectSlug: ProjectSlug,
    versionRevision: RevisionNumberOrAlias
  ): Promise<Uint8Array> {
    // TODO here we should get the file path from the DB in order to fetch the correct file
    // TODO do not forget download counts
    throw new Error("Method not implemented.");
  }

  getBadges(): Promise<BadgeSlug[]> {
    return this.badgeHubMetadata.getBadges();
  }

  getCategories(): Promise<CategoryName[]> {
    return this.badgeHubMetadata.getCategories();
  }

  async refreshReports(): Promise<void> {
    return await this.badgeHubMetadata.refreshReports();
  }

  async getStats(): Promise<BadgeHubStats> {
    return (await this.statsCache.fetch("stats"))!;
  }

  getProjectSummaries(
    query: {
      pageStart?: number;
      pageLength?: number;
      badge?: BadgeSlug;
      category?: CategoryName;
      search?: string;
      slugs?: ProjectSlug[];
      userId?: User["idp_user_id"];
      orderBy: OrderByOption;
    },
    revision: LatestOrDraftAlias
  ): Promise<ProjectSummary[]> {
    return this.badgeHubMetadata.getProjectSummaries(query, revision);
  }

  async writeDraftFile(
    projectSlug: ProjectSlug,
    filePath: string,
    uploadedFile: UploadedFile,
    mockDates?: DBDatedData
  ): Promise<void> {
    if (filePath === "metadata.json") {
      const appMetadata: WriteAppMetadataJSON = appMetadataJSONSchema.parse(
        JSON.parse(new TextDecoder().decode(uploadedFile.fileContent))
      );
      return this.updateDraftMetadata(projectSlug, appMetadata, mockDates);
    }
    Object.assign(uploadedFile, await getImageProps(uploadedFile));
    await this._writeDraftFile(
      projectSlug,
      filePath.split("/"),
      uploadedFile,
      mockDates
    );
  }

  async writeDraftProjectZip(projectSlug: string, zipContent: Uint8Array) {
    throw new Error("Method not implemented.");
    // TODO when implementing file management, we should still decide whether we want to delete here, then get all files and save them with updateDraftFile, or better let the file management handle this more.
    // TODO database management: project metadata in db should be updated with the metadata.json from the zip file
  }

  async updateDraftMetadata(
    slug: string,
    newAppMetadata: WriteAppMetadataJSON,
    mockDates?: DBDatedData
  ): Promise<void> {
    const oldProject = await this.badgeHubMetadata.getProject(slug, "draft");

    const newAdminCategories = newAppMetadata.categories
      ?.filter(isAdminCategory)
      .filter((cat) => {
        return !oldProject?.version.app_metadata.categories?.includes(cat);
      });
    const removedAdminCategories = oldProject?.version.app_metadata.categories
      ?.filter(isAdminCategory)
      .filter((cat) => {
        return !newAppMetadata.categories?.includes(cat);
      });
    if (newAdminCategories?.length) {
      throw new UserError(
        `Change of admin category [${[...newAdminCategories, removedAdminCategories].join(",")}] detected, this is only allowed for admins.`
      );
    }
    await this.badgeHubMetadata.updateDraftMetadata(
      slug,
      newAppMetadata,
      mockDates
    );
    const fileContent = new TextEncoder().encode(
      JSON.stringify(newAppMetadata)
    );
    await this._writeDraftFile(
      slug,
      ["metadata.json"],
      {
        mimetype: "application/json",
        fileContent,
        directory: undefined,
        fileName: undefined,
        size: fileContent.length,
      },
      mockDates
    );
  }

  async setDraftIconFromFile(
    projectSlug: ProjectSlug,
    sourceFilePath: string,
    sizes: IconSize[],
    project?: ProjectDetails
  ): Promise<Record<IconSize, string> | undefined> {
    const draftProject =
      project ?? (await this.badgeHubMetadata.getProject(projectSlug, "draft"));
    if (!draftProject) {
      return undefined;
    }

    const fileMetadata = await this.getFileMetadata(
      projectSlug,
      "draft",
      sourceFilePath
    );
    if (!fileMetadata) {
      return undefined;
    }

    const fileContents = await this.getFileContents(
      projectSlug,
      "draft",
      sourceFilePath
    );
    if (!fileContents) {
      return undefined;
    }

    if (!fileMetadata.mimetype.startsWith("image/")) {
      throw new UserError(
        `File '${sourceFilePath}' is not a supported image for icon conversion.`
      );
    }

    const uniqueSizes = Array.from(new Set(sizes));
    const iconPaths: Partial<Record<IconSize, string>> = {};

    for (const size of uniqueSizes) {
      const iconSize = parseIconSize(size);
      let iconBuffer: Buffer;
      try {
        iconBuffer = await createIconBuffer(fileContents, iconSize);
      } catch {
        throw new UserError(
          `Could not convert '${sourceFilePath}' into a ${size} icon.`
        );
      }
      const iconPath = `icon-${size}.png`;
      await this.writeDraftFile(projectSlug, iconPath, {
        mimetype: "image/png",
        fileContent: iconBuffer,
        size: iconBuffer.length,
      });
      iconPaths[size] = iconPath;
    }

    const existingMetadata = draftProject.version.app_metadata ?? {};
    const icon_map = {
      ...(existingMetadata.icon_map ?? {}),
      ...iconPaths,
    };
    await this.updateDraftMetadata(projectSlug, {
      ...existingMetadata,
      icon_map,
    });

    return iconPaths as Record<IconSize, string>;
  }

  getFileMetadata(
    projectSlug: string,
    versionRevision: RevisionNumberOrAlias,
    filePath: string
  ): Promise<FileMetadata | undefined> {
    return this.badgeHubMetadata.getFileMetadata(
      projectSlug,
      versionRevision,
      filePath
    );
  }

  private async _writeDraftFile(
    slug: string,
    pathParts: string[],
    uploadedFile: UploadedFile,
    mockDates?: DBDatedData
  ) {
    const sha256 = await uint8ToSha256(uploadedFile.fileContent);
    await this.badgeHubFiles.writeFile(uploadedFile, sha256, mockDates);
    await this.badgeHubMetadata.writeDraftFileMetadata(
      slug,
      pathParts,
      uploadedFile,
      sha256,
      mockDates
    );
  }

  async deleteDraftFile(slug: ProjectSlug, filePath: string) {
    if (filePath === "metadata.json") {
      throw new Error(
        `[project: ${slug}] Cannot delete metadata.json because it is required.`
      );
    }
    await this.badgeHubMetadata.deleteDraftFile(slug, filePath);
  }

  async registerBadge(flashId: string, mac: string | undefined) {
    await this.badgeHubMetadata.registerBadge(flashId, mac);
  }

  async reportInstall(
    slug: ProjectSlug,
    revision: number,
    badge: { id?: string; mac?: string }
  ): Promise<void> {
    if (badge.id) {
      await this.registerBadge(badge.id, badge.mac);
      await this.badgeHubMetadata.reportEvent(
        slug,
        revision,
        badge.id,
        "install_count"
      );
    }
  }

  async reportLaunch(
    slug: ProjectSlug,
    revision: number,
    badge: { id?: string; mac?: string }
  ): Promise<void> {
    if (badge.id) {
      await this.registerBadge(badge.id, badge.mac);
      await this.badgeHubMetadata.reportEvent(
        slug,
        revision,
        badge.id,
        "launch_count"
      );
    }
  }

  async reportCrash(
    slug: ProjectSlug,
    revision: number,
    badge: { id?: string; mac?: string },
    body: { reason?: string }
  ): Promise<void> {
    if (badge.id) {
      await this.registerBadge(badge.id, badge.mac);
      await this.badgeHubMetadata.reportEvent(
        slug,
        revision,
        badge.id,
        "crash_count"
      );
    }
  }

  async revokeProjectAPIToken(slug: ProjectSlug) {
    await this.badgeHubMetadata.revokeProjectApiToken(slug);
  }

  async getProjectApiTokenMetadata(slug: ProjectSlug) {
    return this.badgeHubMetadata.getProjectApiTokenMetadata(slug);
  }

  async createProjectApiToken(slug: ProjectSlug) {
    const apiKey = randomBytes(16).toString("hex");
    const keyHash = await stringToSha256(apiKey);
    await this.badgeHubMetadata.createProjectApiToken(slug, keyHash);
    return apiKey;
  }

  async checkApiToken(slug: ProjectSlug, apiToken: string) {
    const tokenHash = await this.badgeHubMetadata.getProjectApiTokenHash(slug);
    return Boolean(apiToken && (await stringToSha256(apiToken)) === tokenHash);
  }
}
