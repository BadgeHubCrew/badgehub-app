import React from "react";
import { OptionSelectorWithTitle } from "@sharedComponents/OptionSelector/OptionSelectorWithTitle.tsx";
import { MultiSelectWithTitle } from "@sharedComponents/OptionSelector/MultiSelectWithTitle.tsx";
import {
  CategoryName,
  getAllCategoryNames,
} from "@shared/domain/readModels/project/Category.ts";

// Single-select props
interface SingleSelectProps {
  multiSelect?: false;
  category: CategoryName | undefined;
  onCategoryChange: (selectedCategory: CategoryName | undefined) => void;
  noValueSetName: string;
}

// Multi-select props
interface MultiSelectProps {
  multiSelect: true;
  categories: CategoryName[];
  onCategoriesChange: (selectedCategories: CategoryName[]) => void;
  noValueSetName: string;
  compact?: boolean; // For filter vs edit page styling
}

type CategorySelectorProps = SingleSelectProps | MultiSelectProps;

export const CategorySelector: React.FC<CategorySelectorProps> = (props) => {
  const availableCategories = getAllCategoryNames();

  // Single-select mode (existing behavior)
  if (!props.multiSelect) {
    const valueMap: Record<string, string> = Object.fromEntries(
      availableCategories.map((c) => [c, c])
    );
    return (
      <OptionSelectorWithTitle
        noValueSetName={props.noValueSetName}
        title="Category"
        valueMap={valueMap}
        value={props.category}
        onValueSelection={props.onCategoryChange}
      />
    );
  }

  // Multi-select mode using the abstraction
  return (
    <MultiSelectWithTitle
      title="Category"
      options={availableCategories}
      selectedOptions={props.categories}
      onOptionsChange={props.onCategoriesChange}
      noValueSetName={props.noValueSetName}
      compact={props.compact}
      testId="category-dropdown"
    />
  );
};
