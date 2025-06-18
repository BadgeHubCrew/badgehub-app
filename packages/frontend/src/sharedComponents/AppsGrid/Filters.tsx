import React from "react";
import { CategorySlug } from "@shared/domain/readModels/project/Category.ts";
import { BadgeSlug } from "@shared/domain/readModels/Badge.ts";
import { CategorySelector } from "@sharedComponents/OptionSelector/CategorySelector.tsx";
import { BadgeSelector } from "@sharedComponents/OptionSelector/BadgeSelector.tsx";
import { OptionSelectorWithTitle } from "@sharedComponents/OptionSelector/OptionSelectorWithTitle.tsx";

interface FiltersProps {
  badge: BadgeSlug | undefined;
  category: CategorySlug | undefined;
  sortBy: string | undefined;
  onBadgeChange: (value: BadgeSlug | undefined) => void;
  onCategoryChange: (value: CategorySlug | undefined) => void;
  onSortByChange: (value: string | undefined) => void;
  onResetFilters: () => void;
}
const Filters: React.FC<FiltersProps> = ({
  badge,
  category,
  sortBy,
  onBadgeChange,
  onCategoryChange,
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
          noValueSetName={"No Sorting"}
          onValueSelection={onSortByChange}
          valueMap={undefined}
          value={sortBy}
        />

        <div className="flex items-end todoElement">
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
