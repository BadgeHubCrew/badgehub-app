import React from "react";
import { AppCreationFormData } from "./AppCreationPage";
import {
  INVALID_SLUG_CHAR_REGEX,
  VALID_SLUG_PATTERN,
} from "@shared/contracts/slug.ts";

const AppCreationBasicInfo: React.FC<{
  form: AppCreationFormData;
  onChange: (changes: Partial<AppCreationFormData>) => void;
}> = ({ form, onChange }) => {
  const slug = form.slug || "";

  return (
    <section className="card bg-base-200 shadow-lg">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-2">App Identifier (Slug)</h2>
        <div className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">App Identifier (Slug)</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full font-mono"
              placeholder="e.g., my_weather_station or com.example.myapp"
              value={slug}
              onChange={(e) => {
                const value = e.target.value.replace(
                  INVALID_SLUG_CHAR_REGEX,
                  "_"
                );
                onChange({ slug: value });
              }}
              data-testid="app-creation-slug-input"
              pattern={VALID_SLUG_PATTERN}
              autoComplete="off"
            />
            <label className="label">
              <span className="label-text-alt">
                Lowercase letters, numbers, and underscores only. Should start
                with a letter and contain at least 3 characters.
              </span>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppCreationBasicInfo;
