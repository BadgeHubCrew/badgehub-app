import React from "react";
import { ProjectEditFormData } from "@pages/AppEditPage/ProjectEditFormData.ts";
import { MultiCategorySelector } from "@sharedComponents/OptionSelector/MultiCategorySelector.tsx";
import { MultiBadgeSelector } from "@sharedComponents/OptionSelector/MultiBadgeSelector.tsx";

const AppEditCategorization: React.FC<{
  form: ProjectEditFormData;
  onChange: (changes: Partial<ProjectEditFormData>) => void;
}> = ({ form, onChange }) => (
  <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
    <h2 className="text-2xl font-semibold text-slate-100 mb-4">
      Categorization
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <MultiBadgeSelector
        noValueSetName="Please select"
        badges={form.badges}
        onBadgeChange={(newValue) =>
          onChange({
            badges: newValue.length === 0 ? undefined : newValue,
          })
        }
      />
      <MultiCategorySelector
        noValueSetName="Please select"
        categories={form.categories}
        onCategoryChange={(newValue) =>
          onChange({
            categories: newValue.length === 0 ? undefined : newValue,
          })
        }
      />
      <div>
        <label
          htmlFor="licenseFile"
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          License
        </label>
        <input
          type="text"
          className="w-full form-input p-2"
          id="licenseFile"
          value={form.license_file}
          onChange={(e) => onChange({ license_file: e.target.value })}
        />
      </div>
    </div>
  </section>
);

export default AppEditCategorization;
