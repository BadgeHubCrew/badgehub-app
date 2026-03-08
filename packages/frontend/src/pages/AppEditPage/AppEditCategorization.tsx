import React from "react";
import { ProjectEditFormData } from "@pages/AppEditPage/ProjectEditFormData.ts";
import { MultiCategorySelector } from "@sharedComponents/OptionSelector/MultiCategorySelector.tsx";
import { MultiBadgeSelector } from "@sharedComponents/OptionSelector/MultiBadgeSelector.tsx";

const AppEditCategorization: React.FC<{
  form: ProjectEditFormData;
  onChange: (changes: Partial<ProjectEditFormData>) => void;
}> = ({ form, onChange }) => (
  <section className="card bg-base-200 shadow-lg">
    <div className="card-body">
      <h2 className="card-title text-2xl mb-2">Categorization</h2>
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
        <div className="form-control">
          <label htmlFor="licenseType" className="label">
            <span className="label-text">License Type</span>
            <span className="label-text-alt whitespace-normal break-words">e.g., MIT</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            id="licenseType"
            value={form.license_type || ""}
            onChange={(e) => onChange({ license_type: e.target.value })}
          />
        </div>
      </div>
    </div>
  </section>
);

export default AppEditCategorization;
