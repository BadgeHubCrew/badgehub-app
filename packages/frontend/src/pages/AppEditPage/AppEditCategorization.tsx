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
          htmlFor="licenseType"
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          License Type
        </label>
        <input
          type="text"
          className="w-full form-input p-2"
          id="licenseType"
          value={form.license_type || ""}
          onChange={(e) => onChange({ license_type: e.target.value })}
        />
        <p className="text-xs text-slate-500 mt-1">License Type, eg MIT</p>
      </div>
    </div>
  </section>
);

export default AppEditCategorization;
