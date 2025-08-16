import type { ProjectEditFormData } from "@pages/AppEditPage/ProjectEditFormData.ts";
import GitLink from "@sharedComponents/GitLink.tsx";
import MarkdownText from "@sharedComponents/MarkdownText.tsx";
import type React from "react";
import { useState } from "react";

/**
 * A component for editing the basic information of an application.
 * It includes fields for the app's name, author, description, Git URL,
 * and a toggle to control its visibility in public listings.
 */
const AppEditBasicInfo: React.FC<{
  form: ProjectEditFormData;
  onChange: (changes: Partial<ProjectEditFormData>) => void;
}> = ({ form, onChange }) => {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  return (
    <section className="card bg-base-200 shadow-lg">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-2">Basic Information</h2>
        <div className="space-y-4">
          {/* App Name and Author */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label htmlFor="appName" className="label">
                <span className="label-text">App Name</span>
              </label>
              <input
                type="text"
                id="appName"
                className="input input-bordered w-full"
                value={form.name || ""}
                onChange={(e) => onChange({ name: e.target.value })}
              />
            </div>
            <div className="form-control">
              <label htmlFor="author" className="label">
                <span className="label-text">Author</span>
              </label>
              <input
                type="text"
                id="author"
                className="input input-bordered w-full"
                value={form.author || ""}
                onChange={(e) => onChange({ author: e.target.value })}
              />
            </div>
          </div>

          {/* Git URL */}
          <div className="form-control">
            <label htmlFor="gitUrl" className="label">
              <span className="label-text flex items-center">
                Git URL
                <GitLink url={form.git_url} />
              </span>
            </label>
            <input
              type="url"
              id="gitUrl"
              placeholder="https://github.com/user/repo"
              className="input input-bordered w-full"
              value={form.git_url || ""}
              onChange={(e) => onChange({ git_url: e.target.value })}
            />
          </div>

          <div className="form-control">
            <label htmlFor="version" className="label">
              <span className="label-text">Version</span>
            </label>
            <input
              type="text"
              id="version"
              placeholder="1.0.0"
              className="input input-bordered w-full"
              value={form.version || ""}
              onChange={(e) => onChange({ version: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label htmlFor="description" className="label">
                <span className="label-text">Short Description</span>
              </label>
              <textarea
                id="description"
                rows={4}
                className="textarea textarea-bordered w-full"
                value={form.description || ""}
                onChange={(e) => onChange({ description: e.target.value })}
              />
              <div className="label">
                <span className="label-text-alt whitespace-normal break-words">
                  Used where space is limited. Hidden on the detail page when a
                  long description is provided.
                </span>
              </div>
            </div>

            <div className="form-control">
              <div className="label">
                <span className="label-text">Long Description</span>
                <span className="label-text-alt">Markdown supported</span>
              </div>
              <div role="tablist" className="tabs tabs-border mb-2">
                <button
                  type="button"
                  role="tab"
                  onClick={() => setActiveTab("write")}
                  className={`tab ${activeTab === "write" ? "tab-active" : ""}`}
                >
                  Write
                </button>
                <button
                  type="button"
                  role="tab"
                  onClick={() => setActiveTab("preview")}
                  className={`tab ${activeTab === "preview" ? "tab-active" : ""}`}
                >
                  Preview
                </button>
              </div>
              {activeTab === "write" ? (
                <textarea
                  id="longDescription"
                  rows={4}
                  className="textarea textarea-bordered w-full font-mono"
                  value={form.long_description || ""}
                  onChange={(e) =>
                    onChange({ long_description: e.target.value })
                  }
                />
              ) : (
                <div className="min-h-28 rounded-box border border-base-300 p-3">
                  {form.long_description ? (
                    <MarkdownText>{form.long_description}</MarkdownText>
                  ) : (
                    <p className="opacity-60 italic">
                      No long description provided.
                    </p>
                  )}
                </div>
              )}
              <div className="label">
                <span className="label-text-alt whitespace-normal break-words">
                  Preferred on the detail page and other layouts with enough
                  room. Falls back to the short description when empty.
                </span>
              </div>
            </div>
          </div>

          {/* Hidden Toggle */}
          <div className="form-control">
            <label
              htmlFor="hidden"
              className="label cursor-pointer justify-start gap-3"
            >
              <input
                type="checkbox"
                id="hidden"
                className="checkbox checkbox-primary"
                checked={!!form.hidden}
                onChange={(e) => onChange({ hidden: e.target.checked })}
              />
              <span className="label-text">Hidden</span>
              <span className="label-text-alt whitespace-normal break-words">
                If checked, this app will not appear in public listings.
              </span>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppEditBasicInfo;
