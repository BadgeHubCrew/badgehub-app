import React from "react";
import { MultiOptionSelectorWithTitle } from "@sharedComponents/OptionSelector/MultiOptionSelectorWithTitle.tsx";
import {
  CategoryName,
  getAllCategoryNames,
  isAdminCategory,
} from "@shared/domain/readModels/project/Category.ts";
import { useState } from "react";

export const MultiCategorySelector: React.FC<{
  noValueSetName: string;
  categories: CategoryName[] | undefined;
  onCategoryChange: (selectedCategories: CategoryName[]) => void;
}> = ({ categories, onCategoryChange, noValueSetName }) => {
  const valueMap: Record<string, string> = Object.fromEntries(
    getAllCategoryNames().map((c) => [c, c])
  );
  const selectedCategories = categories ?? [];
  const [limitError, setLimitError] = useState<string | null>(null);
  const handleSelection = (nextSelection: string[]) => {
    const nonAdminCount = nextSelection.filter(
      (category) => !isAdminCategory(category)
    ).length;
    if (nonAdminCount > 3) {
      setLimitError("You can set at most 3 categories");
      return;
    }
    setLimitError(null);
    onCategoryChange(nextSelection as CategoryName[]);
  };
  return (
    <div>
      <MultiOptionSelectorWithTitle
        noValueSetName={noValueSetName}
        title="Category"
        valueMap={valueMap}
        value={selectedCategories}
        onValueSelection={handleSelection}
      />
      {limitError && (
        <p className="text-xs text-red-400 mt-2">{limitError}</p>
      )}
    </div>
  );
};
