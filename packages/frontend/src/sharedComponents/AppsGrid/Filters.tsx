import type { BadgeSlug } from "@shared/domain/readModels/Badge.ts";
import type { CategoryName } from "@shared/domain/readModels/project/Category.ts";
import type { OrderByOption } from "@shared/domain/readModels/project/ordering.ts";
import { BadgeSelector } from "@sharedComponents/OptionSelector/BadgeSelector.tsx";
import { CategorySelector } from "@sharedComponents/OptionSelector/CategorySelector.tsx";
import { OptionSelectorWithTitle } from "@sharedComponents/OptionSelector/OptionSelectorWithTitle.tsx";
import type React from "react";
import { useState } from "react";

export type SortOption = OrderByOption | undefined;

interface FiltersProps {
  badge: BadgeSlug | undefined;
  category: CategoryName | undefined;
  sortBy: SortOption;
  onBadgeChange: (value: BadgeSlug | undefined) => void;
  onCategoryChange: (value: CategoryName | undefined) => void;
  onSortByChange: (value: SortOption) => void;
  onResetFilters: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

const Filters: React.FC<FiltersProps> = ({
  badge,
  category,
  sortBy,
  onBadgeChange,
  onCategoryChange,
  onSortByChange,
  onResetFilters,
  searchQuery,
  setSearchQuery,
}) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filterControls = (
    <>
      <BadgeSelector
        noValueSetName={"All"}
        badge={badge}
        onBadgeChange={onBadgeChange}
      />
      <CategorySelector
        noValueSetName={"All"}
        category={category}
        onCategoryChange={onCategoryChange}
      />
      <OptionSelectorWithTitle
        title={"Sort By"}
        noValueSetName={"Last Updated"}
        onValueSelection={onSortByChange}
        valueMap={
          {
            installs: "Most Installed",
            name: "App Name",
          } as const satisfies Partial<Record<OrderByOption, string>>
        }
        value={sortBy}
      />
    </>
  );

  return (
    <>
      {!mobileFiltersOpen && (
        <section
          className="hidden lg:block card bg-base-200 shadow mb-8 p-4"
          data-testid="filter-bar"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {filterControls}

            <div className="flex items-end">
              <button
                className="w-full btn btn-primary btn-sm flex items-center justify-center"
                type="button"
                onClick={onResetFilters}
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V15a1 1 0 01-.293.707l-2 2A1 1 0 019 17v-6.586L4.293 6.707A1 1 0 014 6V3z" />
                </svg>
                Reset Filters
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="lg:hidden sticky top-16 z-30 -mx-4 mb-4 border-b border-base-300 bg-base-100 px-4 py-3 shadow-sm">
        <div className="flex gap-3">
          {setSearchQuery && (
            <label className="input input-bordered input-sm flex flex-1 items-center gap-2">
              <svg
                className="h-4 w-4 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="mobile-search-bar"
                className="min-w-0 grow"
              />
            </label>
          )}
          <button
            id="openFiltersBtn"
            className="btn btn-primary btn-sm flex shrink-0 items-center gap-2"
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={mobileFiltersOpen}
          >
            <svg
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V15a1 1 0 01-.293.707l-2 2A1 1 0 019 17v-6.586L4.293 6.707A1 1 0 014 6V3z" />
            </svg>
            Filters
          </button>
        </div>
      </section>

      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-filter-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
          />

          <div className="relative flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-base-100 shadow-2xl">
            <div className="flex justify-center pb-1 pt-3">
              <div className="h-1.5 w-12 rounded-full bg-base-300" />
            </div>

            <div className="flex items-center justify-between border-b border-base-300 px-5 py-3">
              <h3
                id="mobile-filter-title"
                className="text-lg font-bold text-base-content"
              >
                Filters & Sorting
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm"
                aria-label="Close filters"
                onClick={() => setMobileFiltersOpen(false)}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
              {filterControls}
            </div>

            <div className="flex flex-col gap-3 border-t border-base-300 bg-base-100 px-5 pb-6 pt-4">
              <button
                className="btn btn-primary w-full"
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Show Results
              </button>
              <button
                className="btn btn-outline w-full"
                type="button"
                onClick={onResetFilters}
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Filters;
