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
        multiSelect={true}
        noValueSetName="No badges available"
        badges={form.badges || []}
        onBadgesChange={(newBadges) =>
          onChange({
            badges: newBadges.length === 0 ? undefined : newBadges,
          })
        }
      />
      <CategorySelector
        multiSelect={true}
        noValueSetName="No categories available"
        categories={form.categories || []}
        onCategoriesChange={(newCategories) =>
          onChange({
            categories: newCategories.length === 0 ? undefined : newCategories,
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
