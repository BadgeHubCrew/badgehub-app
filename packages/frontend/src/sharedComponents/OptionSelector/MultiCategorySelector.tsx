import React from "react";
import { MultiOptionSelectorWithTitle } from "@sharedComponents/OptionSelector/MultiOptionSelectorWithTitle.tsx";
import {
  CategoryName,
  getAllCategoryNames,
  isAdminCategory,
} from "@shared/domain/readModels/project/Category.ts";

export const MultiCategorySelector: React.FC<{
  noValueSetName: string;
  categories: CategoryName[] | undefined;
  onCategoryChange: (selectedCategories: CategoryName[]) => void;
}> = ({ categories, onCategoryChange, noValueSetName }) => {
  const valueMap: Record<string, string> = Object.fromEntries(
    getAllCategoryNames().map((c) => [c, c])
  );
  const selectedCategories = categories ?? [];
  const handleSelection = (nextSelection: string[]) => {
    const nonAdminCount = nextSelection.filter(
      (category) => !isAdminCategory(category)
    ).length;
    if (nonAdminCount > 3) {
      return;
    }
    onCategoryChange(nextSelection as CategoryName[]);
  };
  return (
    <MultiOptionSelectorWithTitle
      noValueSetName={noValueSetName}
      title="Category"
      valueMap={valueMap}
      value={selectedCategories}
      onValueSelection={handleSelection}
    />
  );
};
