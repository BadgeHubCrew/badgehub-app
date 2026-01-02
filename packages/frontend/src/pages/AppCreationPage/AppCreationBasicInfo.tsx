import React from "react";
import { AppCreationFormData } from "./AppCreationPage";
import { VALID_SLUG_PATTERN } from "@shared/contracts/slug.ts";

const AppCreationBasicInfo: React.FC<{
  form: AppCreationFormData;
  onChange: (changes: Partial<AppCreationFormData>) => void;
}> = ({ form, onChange }) => {
  const slug = form.slug || "";

  return (
    <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-slate-100 mb-4">
        App Identifier (Slug)
      </h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            App Identifier (Slug)
          </label>
          <input
            type="text"
            className="w-full form-input p-2 font-mono"
            placeholder="e.g., my_weather_station"
            value={slug}
            onChange={(e) => {
              const value = e.target.value.replace(/[^.a-z0-9_-]/g, "_");
              onChange({ slug: value });
            }}
            data-testid="app-creation-slug-input"
            pattern={VALID_SLUG_PATTERN}
            autoComplete="off"
          />
          <p className="text-xs text-slate-500 mt-1">
            Lowercase letters, numbers, and underscores only. Should start with
            a letter and contain at least 3 characters.
          </p>
        </div>
        {/*
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            URL Preview
          </label>
          <div
            className="slug-preview font-mono text-sm"
            data-testid="app-creation-slug-preview"
          >
            <span className="text-slate-500">
              {BADGEHUB_FRONTEND_BASE_URL}/
            </span>
            <span className="text-emerald-400">{slug}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            This will be the unique URL for your app.
          </p>
        </div>
        */}
      </div>
    </section>
  );
};

export default AppCreationBasicInfo;
