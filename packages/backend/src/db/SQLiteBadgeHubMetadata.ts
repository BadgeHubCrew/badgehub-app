import { BadgeHubMetadataStore } from "@domain/BadgeHubMetadataStore";

export class SQLiteBadgeHubMetadata implements BadgeHubMetadataStore {
  private fail(method: string): never {
    throw new Error(`SQLiteBadgeHubMetadata.${method} is not implemented yet.`);
  }

  insertProject(..._args: Parameters<BadgeHubMetadataStore["insertProject"]>) { this.fail("insertProject"); }
  updateProject(..._args: Parameters<BadgeHubMetadataStore["updateProject"]>) { this.fail("updateProject"); }
  deleteProject(..._args: Parameters<BadgeHubMetadataStore["deleteProject"]>) { this.fail("deleteProject"); }
  publishVersion(..._args: Parameters<BadgeHubMetadataStore["publishVersion"]>) { this.fail("publishVersion"); }
  getProject(..._args: Parameters<BadgeHubMetadataStore["getProject"]>) { this.fail("getProject"); }
  getFileMetadata(..._args: Parameters<BadgeHubMetadataStore["getFileMetadata"]>) { this.fail("getFileMetadata"); }
  getBadges(..._args: Parameters<BadgeHubMetadataStore["getBadges"]>) { this.fail("getBadges"); }
  getCategories(..._args: Parameters<BadgeHubMetadataStore["getCategories"]>) { this.fail("getCategories"); }
  refreshReports(..._args: Parameters<BadgeHubMetadataStore["refreshReports"]>) { this.fail("refreshReports"); }
  getStats(..._args: Parameters<BadgeHubMetadataStore["getStats"]>) { this.fail("getStats"); }
  getProjectSummaries(..._args: Parameters<BadgeHubMetadataStore["getProjectSummaries"]>) { this.fail("getProjectSummaries"); }
  updateDraftMetadata(..._args: Parameters<BadgeHubMetadataStore["updateDraftMetadata"]>) { this.fail("updateDraftMetadata"); }
  writeDraftFileMetadata(..._args: Parameters<BadgeHubMetadataStore["writeDraftFileMetadata"]>) { this.fail("writeDraftFileMetadata"); }
  deleteDraftFile(..._args: Parameters<BadgeHubMetadataStore["deleteDraftFile"]>) { this.fail("deleteDraftFile"); }
  registerBadge(..._args: Parameters<BadgeHubMetadataStore["registerBadge"]>) { this.fail("registerBadge"); }
  reportEvent(..._args: Parameters<BadgeHubMetadataStore["reportEvent"]>) { this.fail("reportEvent"); }
  revokeProjectApiToken(..._args: Parameters<BadgeHubMetadataStore["revokeProjectApiToken"]>) { this.fail("revokeProjectApiToken"); }
  getProjectApiTokenMetadata(..._args: Parameters<BadgeHubMetadataStore["getProjectApiTokenMetadata"]>) { this.fail("getProjectApiTokenMetadata"); }
  createProjectApiToken(..._args: Parameters<BadgeHubMetadataStore["createProjectApiToken"]>) { this.fail("createProjectApiToken"); }
  getProjectApiTokenHash(..._args: Parameters<BadgeHubMetadataStore["getProjectApiTokenHash"]>) { this.fail("getProjectApiTokenHash"); }
}
