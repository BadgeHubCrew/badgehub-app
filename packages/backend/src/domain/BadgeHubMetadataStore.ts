import { ProjectDetails, ProjectSlug } from "@shared/domain/readModels/project/ProjectDetails";
import {
  LatestOrDraftAlias,
  RevisionNumberOrAlias,
} from "@shared/domain/readModels/project/Version";
import { FileMetadata } from "@shared/domain/readModels/project/FileMetadata";
import { BadgeSlug } from "@shared/domain/readModels/Badge";
import { CategoryName } from "@shared/domain/readModels/project/Category";
import { DBDatedData } from "@db/models/project/DBDatedData";
import { DBProject } from "@db/models/project/DBProject";
import { UploadedFile } from "@shared/domain/UploadedFile";
import { WriteAppMetadataJSON } from "@shared/domain/writeModels/AppMetadataJSON";
import { BadgeHubStats } from "@shared/domain/readModels/BadgeHubStats";
import { ProjectSummary } from "@shared/domain/readModels/project/ProjectSummaries";
import { OrderByOption } from "@shared/domain/readModels/project/ordering";
import { CreateProjectProps } from "@shared/domain/writeModels/project/WriteProject";
import { TimestampTZ } from "@db/models/DBTypes";
import { User } from "@shared/domain/readModels/project/User";

export interface BadgeHubMetadataStore {
  insertProject(project: CreateProjectProps, mockDates?: DBDatedData): Promise<void>;
  updateProject(projectSlug: ProjectSlug, changes: Partial<Omit<DBProject, "slug">>): Promise<void>;
  deleteProject(projectSlug: ProjectSlug): Promise<void>;
  publishVersion(projectSlug: ProjectSlug, mockDate?: TimestampTZ): Promise<void>;
  getProject(
    projectSlug: ProjectSlug,
    versionRevision: RevisionNumberOrAlias
  ): Promise<undefined | ProjectDetails>;
  getFileMetadata(
    projectSlug: string,
    versionRevision: RevisionNumberOrAlias,
    filePath: string
  ): Promise<FileMetadata | undefined>;
  getBadges(): Promise<BadgeSlug[]>;
  getCategories(): Promise<CategoryName[]>;
  refreshReports(): Promise<void>;
  getStats(): Promise<BadgeHubStats>;
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
  ): Promise<ProjectSummary[]>;
  updateDraftMetadata(
    slug: string,
    newAppMetadata: WriteAppMetadataJSON,
    mockDates?: DBDatedData
  ): Promise<void>;
  writeDraftFileMetadata(
    slug: string,
    pathParts: string[],
    uploadedFile: UploadedFile,
    sha256: string,
    mockDates?: DBDatedData
  ): Promise<void>;
  deleteDraftFile(slug: ProjectSlug, filePath: string): Promise<void>;
  registerBadge(flashId: string, mac: string | undefined): Promise<void>;
  reportEvent(
    slug: ProjectSlug,
    revision: number,
    badgeId: string,
    eventType: "install_count" | "launch_count" | "crash_count"
  ): Promise<void>;
  revokeProjectApiToken(slug: ProjectSlug): Promise<void>;
  getProjectApiTokenMetadata(slug: ProjectSlug): Promise<{ created_at: string; last_used_at: string | null } | undefined>;
  createProjectApiToken(slug: ProjectSlug, tokenHash: string): Promise<void>;
  getProjectApiTokenHash(slug: ProjectSlug): Promise<string | undefined>;
}
