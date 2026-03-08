import { useEffect, useMemo, useState } from "react";
import type { AppCardProps } from "@sharedComponents/types.ts";
import Filters, { SortOption } from "@sharedComponents/AppsGrid/Filters.tsx";
import Spinner from "@sharedComponents/Spinner.tsx";
import AppsGrid from "@sharedComponents/AppsGrid/AppsGrid.tsx";
import Pagination from "@sharedComponents/AppsGrid/Pagination.tsx";
import { z } from "zod/v3";
import { getProjectsQuerySchema } from "@shared/contracts/publicRestContracts.ts";
import { BadgeSlug } from "@shared/domain/readModels/Badge.ts";
import { CategoryName } from "@shared/domain/readModels/project/Category.ts";
import { ProjectSummary } from "@shared/domain/readModels/project/ProjectSummaries.ts";

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
  const [sortBy, setSortBy] = useState<SortOption>();
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Fetch apps with filters
  useEffect(() => {
    setLoading(true);

    appFetcher({ badge, category })
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
  }, [badge, category, appFetcher]);

  // Filter apps by search query before pagination
  const filteredSortedApps = useMemo(() => {
    let result = apps;
    if (sortBy === "mostInstalled") {
      result = [...apps].sort((a, b) => b.installs - a.installs);
    }
    if (!searchQuery.trim()) return result;
    const filteredApps = result.filter((app) =>
      app.name?.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    return filteredApps;
  }, [apps, searchQuery, sortBy]);

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
  };

  return (
    <>
      {!editable && (
        <Filters
          badge={badge}
          category={category}
          sortBy={sortBy}
          onBadgeChange={handleBadgeChange}
          onCategoryChange={handleCategoryChange}
          onSortByChange={setSortBy}
          onResetFilters={handleResetFilters}
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
        <>
          {setSearchQuery && (
            <div className="lg:hidden mb-4">
              <input
                type="search"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="mobile-search-bar"
                className="input input-bordered input-sm w-full"
              />
            </div>
          )}
          <AppsGrid apps={paginatedApps} editable={editable} />
        </>
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
