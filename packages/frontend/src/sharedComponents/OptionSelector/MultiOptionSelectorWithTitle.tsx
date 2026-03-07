import React, { useMemo, useState } from "react";

export const MultiOptionSelectorWithTitle: React.FC<{
  title: string;
  noValueSetName: string;
  valueMap: Record<string, string>;
  value: string[] | undefined;
  onValueSelection: (newValues: string[]) => void;
}> = ({ title, noValueSetName, valueMap, value, onValueSelection }) => {
  const selectionId = `${title.toLowerCase()}-dropdown`;
  const searchId = `${title.toLowerCase()}-search`;
  const selectedValues = value ?? [];
  const [searchQuery, setSearchQuery] = useState("");

  const options = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const entries = Object.entries(valueMap);
    if (!query) {
      return entries;
    }
    return entries.filter(([key, label]) => {
      return (
        key.toLowerCase().includes(query) ||
        label.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, valueMap]);

  const toggleValue = (option: string) => {
    if (selectedValues.includes(option)) {
      onValueSelection(selectedValues.filter((value) => value !== option));
      return;
    }
    onValueSelection([...selectedValues, option]);
  };

  const selectedEntries = selectedValues
    .map((option) => [option, valueMap[option]] as const)
    .filter(([, label]) => label !== undefined);

  return (
    <div>
      <label htmlFor={selectionId} className="label">
        <span className="label-text">{title}</span>
      </label>
      <div className="mb-2">
        <label htmlFor={searchId} className="label">
          <span className="label-text-alt">Search {title}</span>
        </label>
        <input
          id={searchId}
          data-testid={searchId}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input input-bordered input-sm w-full"
          placeholder="Type to filter"
        />
      </div>
      {selectedEntries.length > 0 && (
        <div className="mb-3">
          <p className="text-xs uppercase tracking-wide opacity-60 mb-2">
            Selected
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedEntries.map(([option, label]) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleValue(option)}
                className="badge badge-primary gap-2 cursor-pointer"
                title={`Remove ${label}`}
              >
                <span>{label}</span>
                <span aria-hidden>×</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div
        id={selectionId}
        data-testid={selectionId}
        className="max-h-40 overflow-y-auto rounded-md border border-base-300 p-2 space-y-2"
      >
        {options.map(([option, label]) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm"
              checked={selectedValues.includes(option)}
              onChange={() => toggleValue(option)}
            />
            <span>{label}</span>
          </label>
        ))}
        {options.length === 0 && (
          <p className="text-xs opacity-60">{noValueSetName}</p>
        )}
      </div>
      {selectedValues.length === 0 && options.length > 0 && (
        <p className="text-xs opacity-60 mt-1">{noValueSetName}</p>
      )}
    </div>
  );
};
