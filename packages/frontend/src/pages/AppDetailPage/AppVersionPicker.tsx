import type { ProjectVersions } from "@shared/domain/readModels/project/ProjectVersions.ts";
import type React from "react";

function formatVersionLabel(entry: ProjectVersions[number]): string {
  const label =
    entry.version && entry.version.trim().length > 0
      ? entry.version
      : "Unversioned";
  return `${label} (rev ${entry.latestRevision})`;
}

const AppVersionPicker: React.FC<{
  versions: ProjectVersions;
  selectedRevision: number;
  onSelectRevision: (revision: number) => void;
}> = ({ versions, selectedRevision, onSelectRevision }) => {
  if (versions.length <= 1) {
    return null;
  }

  return (
    <div data-testid="app-version-picker">
      <label htmlFor="app-version-select" className="label py-0">
        <span className="label-text text-sm font-semibold">Version</span>
      </label>
      <select
        id="app-version-select"
        data-testid="app-version-select"
        className="select select-sm select-bordered w-full font-mono"
        value={selectedRevision}
        onChange={(e) => {
          onSelectRevision(Number(e.target.value));
        }}
      >
        {versions.map((entry) => (
          <option key={entry.latestRevision} value={entry.latestRevision}>
            {formatVersionLabel(entry)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AppVersionPicker;
