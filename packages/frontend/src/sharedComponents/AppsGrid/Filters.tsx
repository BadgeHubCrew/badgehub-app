import React from "react";
import { BadgeSlug } from "@shared/domain/readModels/Badge.ts";
import { CategorySelector } from "@sharedComponents/OptionSelector/CategorySelector.tsx";
import { BadgeSelector } from "@sharedComponents/OptionSelector/BadgeSelector.tsx";
import { OptionSelectorWithTitle } from "@sharedComponents/OptionSelector/OptionSelectorWithTitle.tsx";
import { CategoryName } from "@shared/domain/readModels/project/Category.ts";

export type SortOption = "mostInstalled" | undefined;

interface FiltersProps {
  badges: BadgeSlug[];
  categories: CategoryName[];
  sortBy: SortOption;
  onBadgesChange: (values: BadgeSlug[]) => void;
  onCategoriesChange: (values: CategoryName[]) => void;
  onSortByChange: (value: SortOption) => void;
  onResetFilters: () => void;
}

const Filters: React.FC<FiltersProps> = ({
  badges,
  categories,
  sortBy,
  onBadgesChange,
  onCategoriesChange,
  onSortByChange,
  onResetFilters,
}) => {
  return (
    <section
      className="mb-8 p-4 bg-gray-800 rounded-lg shadow"
      data-testid="filter-bar"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <BadgeSelector
          multiSelect={true}
          compact={true}
          noValueSetName={"All"}
          badges={badges}
          onBadgesChange={onBadgesChange}
        />
        <CategorySelector
          multiSelect={true}
          compact={true}
          noValueSetName={"All"}
          categories={categories}
          onCategoriesChange={onCategoriesChange}
        />
        <OptionSelectorWithTitle
          title={"Sort By"}
          noValueSetName={"Last Updated"}
          onValueSelection={onSortByChange}
          valueMap={
            {
              mostInstalled: "Most Installed",
            } as const satisfies Record<"mostInstalled", string>
          }
          value={sortBy}
        />

        <div className="flex items-end">
          <button
            className="w-full btn-primary px-4 py-2 rounded-md text-sm font-semibold flex items-center justify-center"
            type="button"
            onClick={onResetFilters}
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V15a1 1 0 01-.293.707l-2 2A1 1 0 019 17v-6.586L4.293 6.707A1 1 0 014 6V3z" />
            </svg>
            Reset Filters
          </button>
        </div>
      </div>
    </section>
  );
};

export default Filters;
