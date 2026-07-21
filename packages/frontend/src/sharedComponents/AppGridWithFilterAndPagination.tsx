import type { getProjectsQuerySchema } from "@shared/contracts/publicRestContracts.ts";
import type { BadgeSlug } from "@shared/domain/readModels/Badge.ts";
import type { DevelopmentStatus } from "@shared/domain/readModels/project/AppMetadataJSON.ts";
import type { CategoryName } from "@shared/domain/readModels/project/Category.ts";
import type { ProjectSummary } from "@shared/domain/readModels/project/ProjectSummaries.ts";
import AppsGrid from "@sharedComponents/AppsGrid/AppsGrid.tsx";
import Filters, {
  type SortOption,
} from "@sharedComponents/AppsGrid/Filters.tsx";
import Pagination from "@sharedComponents/AppsGrid/Pagination.tsx";
import Spinner from "@sharedComponents/Spinner.tsx";
import type { AppCardProps } from "@sharedComponents/types.ts";
import { useEffect, useMemo, useState } from "react";
import type { z } from "zod";

export type ProjectQueryParams = z.infer<typeof getProjectsQuerySchema>;
export type AppFetcher = (
  filters: ProjectQueryParams
) => Promise<ProjectSummary[] | undefined>;

export const AppGridWithFilterAndPagination = ({
  appFetcher,
  searchQuery,
  setSearchQuery,
  editable = false,
}: {
  appFetcher: AppFetcher;
  searchQuery: string;
  setSearchQuery?: (q: string) => void;
  editable?: boolean;
}) => {
  const [apps, setApps] = useState<AppCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [badge, setBadgeFilter] = useState<BadgeSlug | undefined>();
  const [category, setCategoryFilter] = useState<CategoryName | undefined>();
  const [developmentStatus, setDevelopmentStatus] = useState<
    DevelopmentStatus | undefined
  >();
  const [sortBy, setSortBy] = useState<SortOption>();
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Fetch apps with filters
  useEffect(() => {
    setLoading(true);

    appFetcher({ badge, category, developmentStatus, orderBy: sortBy })
      .then((res) => {
        if (typeof res === "object") {
          const body = res;
          setApps(body);
          setError(null);
        } else {
          setError("Failed to fetch projects, invalid response type.");
        }
      })
      .catch((e) => {
        console.error(e);
        setError(e.message || "Failed to fetch projects");
      })
      .finally(() => setLoading(false));
  }, [badge, category, developmentStatus, appFetcher, sortBy]);

  // Filter apps by search query before pagination
  const filteredSortedApps = useMemo(() => {
    const result = apps;
    if (!searchQuery.trim()) return result;
    const filteredApps = result.filter((app) =>
      app.name?.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    return filteredApps;
  }, [apps, searchQuery]);

  // Compute paginated apps from filteredApps
  const paginatedApps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSortedApps.slice(start, start + pageSize);
  }, [filteredSortedApps, currentPage]);

  // Handlers for Filters component
  const handleBadgeChange = (value: BadgeSlug | undefined) =>
    setBadgeFilter(value);
  const handleCategoryChange = (value: CategoryName | undefined) =>
    setCategoryFilter(value);
  const handleResetFilters = () => {
    setBadgeFilter(undefined);
    setCategoryFilter(undefined);
    setDevelopmentStatus(undefined);
  };

  return (
    <>
      {!editable && (
        <Filters
          badge={badge}
          category={category}
          developmentStatus={developmentStatus}
          sortBy={sortBy}
          onBadgeChange={handleBadgeChange}
          onCategoryChange={handleCategoryChange}
          onDevelopmentStatusChange={setDevelopmentStatus}
          onSortByChange={setSortBy}
          onResetFilters={handleResetFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}
      {loading ? (
        <Spinner />
      ) : error ? (
        <div
          data-testid="error-message"
          className="text-center py-10 text-error"
        >
          {error}
        </div>
      ) : (
        <AppsGrid apps={paginatedApps} editable={editable} />
      )}
      {/* show pagination if more than one page */}
      {Math.ceil(filteredSortedApps.length / pageSize) > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredSortedApps.length / pageSize)}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  );
};
