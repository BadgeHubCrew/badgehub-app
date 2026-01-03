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

  return (
    <div>
      <label
        htmlFor={selectionId}
        className="block text-sm font-medium text-slate-300 mb-1"
      >
        {title}
      </label>
      <div className="mb-2">
        <label
          htmlFor={searchId}
          className="block text-xs font-medium text-slate-400 mb-1"
        >
          Search {title}
        </label>
        <input
          id={searchId}
          data-testid={searchId}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-2 text-sm"
          placeholder="Type to filter"
        />
      </div>
      <div
        id={selectionId}
        data-testid={selectionId}
        className="max-h-40 overflow-y-auto rounded-md border border-gray-700 p-2 space-y-2"
      >
        {options.map(([option, label]) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-emerald-600 focus:ring-emerald-500"
              checked={selectedValues.includes(option)}
              onChange={() => toggleValue(option)}
            />
            <span className="text-slate-300">{label}</span>
          </label>
        ))}
        {options.length === 0 && (
          <p className="text-xs text-slate-500">{noValueSetName}</p>
        )}
      </div>
      {selectedValues.length === 0 && options.length > 0 && (
        <p className="text-xs text-slate-500 mt-1">{noValueSetName}</p>
      )}
    </div>
  );
};
