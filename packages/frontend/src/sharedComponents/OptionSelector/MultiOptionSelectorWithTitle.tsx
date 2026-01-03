import React from "react";

export const MultiOptionSelectorWithTitle: React.FC<{
  title: string;
  noValueSetName: string;
  valueMap: Record<string, string>;
  value: string[] | undefined;
  onValueSelection: (newValues: string[]) => void;
}> = ({ title, noValueSetName, valueMap, value, onValueSelection }) => {
  const selectionId = `${title.toLowerCase()}-dropdown`;
  const selectedValues = value ?? [];

  return (
    <div>
      <label
        htmlFor={selectionId}
        className="block text-sm font-medium text-slate-300 mb-1"
      >
        {title}
      </label>
      <select
        id={selectionId}
        name={selectionId}
        data-testid={selectionId}
        className="w-full border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-2"
        multiple
        value={selectedValues}
        onChange={(e) =>
          onValueSelection(
            Array.from(e.target.selectedOptions).map((option) => option.value)
          )
        }
      >
        {(Object.keys(valueMap) as Array<keyof typeof valueMap>).map(
          (option) => (
            <option key={option} value={option}>
              {valueMap[option]}
            </option>
          )
        )}
      </select>
      {selectedValues.length === 0 && (
        <p className="text-xs text-slate-500 mt-1">{noValueSetName}</p>
      )}
    </div>
  );
};
