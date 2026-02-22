import type { DBDatedData } from "#db/models/project/DBDatedData";

// Corresponds to the 'registered_badges_version_reports' table
export interface DBRegisteredBadgeVersionReportInsert {
  registered_badge_id: string;
  version_id: number;
  install_count?: number;
  launch_count?: number;
  crash_count?: number;
}

export interface DBRegisteredBadgeVersionReport
  extends DBRegisteredBadgeVersionReportInsert,
    DBDatedData {
  id: number;
}

// Corresponds to the 'version_install_reports' materialized view
export interface DBVersionInstallReport {
  version_id: number;
  project_slug: string;
  revision: number;
  distinct_installs: number;
}

// Corresponds to the 'project_install_reports' materialized view
export interface DBProjectInstallReport {
  project_slug: string;
  distinct_installs: string;
}

// Corresponds to the 'version_launch_reports' materialized view
export interface DBVersionLaunchReport {
  version_id: number;
  project_slug: string;
  revision: number;
  distinct_launches: number;
}

// Corresponds to the 'version_crash_reports' materialized view
export interface DBVersionCrashReport {
  version_id: number;
  project_slug: string;
  revision: number;
  distinct_crashes: number;
}
