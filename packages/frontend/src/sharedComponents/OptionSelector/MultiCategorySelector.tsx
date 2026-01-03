import React from "react";
import { MultiOptionSelectorWithTitle } from "@sharedComponents/OptionSelector/MultiOptionSelectorWithTitle.tsx";
import {
  CategoryName,
  getAllCategoryNames,
} from "@shared/domain/readModels/project/Category.ts";

export const MultiCategorySelector: React.FC<{
  noValueSetName: string;
  categories: CategoryName[] | undefined;
  onCategoryChange: (selectedCategories: CategoryName[]) => void;
}> = ({ categories, onCategoryChange, noValueSetName }) => {
  const valueMap: Record<string, string> = Object.fromEntries(
    getAllCategoryNames().map((c) => [c, c])
  );
  return (
    <MultiOptionSelectorWithTitle
      noValueSetName={noValueSetName}
      title="Category"
      valueMap={valueMap}
      value={categories}
      onValueSelection={onCategoryChange}
    />
  );
};
