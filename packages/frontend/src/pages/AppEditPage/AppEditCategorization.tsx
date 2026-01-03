import React from "react";
import { ProjectEditFormData } from "@pages/AppEditPage/ProjectEditFormData.ts";
import { CategorySelector } from "@sharedComponents/OptionSelector/CategorySelector.tsx";
import { BadgeSelector } from "@sharedComponents/OptionSelector/BadgeSelector.tsx";

const AppEditCategorization: React.FC<{
  form: ProjectEditFormData;
  onChange: (changes: Partial<ProjectEditFormData>) => void;
}> = ({ form, onChange }) => (
  <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
    <h2 className="text-2xl font-semibold text-slate-100 mb-4">
      Categorization
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <BadgeSelector
        noValueSetName="Please select"
        badge={form.badges?.[0]}
        onBadgeChange={(newValue) =>
          onChange({
            badges: newValue === undefined ? undefined : [newValue],
          })
        }
      />
      <CategorySelector
        noValueSetName="Please select"
        category={form.categories?.[0]}
        onCategoryChange={(newValue) =>
          onChange({
            categories: newValue === undefined ? undefined : [newValue],
          })
        }
      />
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          License
        </label>
        <input
          type="text"
          className="w-full form-input p-2"
          value={form.license_file}
          onChange={(e) => onChange({ license_file: e.target.value })}
        />
      </div>
    </div>
  </section>
);

export default AppEditCategorization;
