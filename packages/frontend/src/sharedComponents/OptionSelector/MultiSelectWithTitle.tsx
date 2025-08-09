import React, { useState } from "react";

interface MultiSelectWithTitleProps<T> {
  title: string;
  options: T[];
  selectedOptions: T[];
  onOptionsChange: (selected: T[]) => void;
  noValueSetName: string;
  compact?: boolean;
  getOptionDisplay?: (option: T) => string; // Optional custom display function
  getOptionKey?: (option: T) => string; // Optional custom key function
  testId?: string; // For testing purposes
}

export const MultiSelectWithTitle = <T extends string>({
  title,
  options,
  selectedOptions,
  onOptionsChange,
  noValueSetName,
  compact = false,
  getOptionDisplay = (option) => option,
  getOptionKey = (option) => option,
  testId,
}: MultiSelectWithTitleProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleOption = (option: T) => {
    const isSelected = selectedOptions.includes(option);
    if (isSelected) {
      onOptionsChange(selectedOptions.filter(o => o !== option));
    } else {
      onOptionsChange([...selectedOptions, option]);
    }
  };

  const clearAllOptions = () => {
    onOptionsChange([]);
  };

  if (!options.length) {
    return (
      <div>
        <div className="text-sm font-medium text-slate-300 mb-2">{title}</div>
        <div className="w-full form-input p-2 text-slate-500 italic">
          No {title.toLowerCase()}s configured
        </div>
      </div>
    );
  }

  if (compact) {
    // Compact dropdown style for filters
    const getDisplayText = () => {
      if (selectedOptions.length === 0) {
        return `All ${title}s`;
      } else if (selectedOptions.length === options.length) {
        return `All ${title}s`;
      } else if (selectedOptions.length === 1 && selectedOptions[0] !== undefined) {
        return getOptionDisplay(selectedOptions[0]);
      } else {
        return `${selectedOptions.length} ${title.toLowerCase()}s`;
      }
    };

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-slate-300 mb-1">
          {title}
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-left text-sm focus:ring-emerald-500 focus:border-emerald-500 flex justify-between items-center text-slate-200 hover:bg-gray-600"
          data-testid={testId}
        >
          <span className="truncate">{getDisplayText()}</span>
          <svg 
            className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg">
            <div className="p-2 border-b border-gray-600">
              <button
                type="button"
                onClick={clearAllOptions}
                className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {options.map((option) => (
                <label
                  key={getOptionKey(option)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option)}
                    onChange={() => handleToggleOption(option)}
                    className="rounded border-gray-500 bg-gray-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-200">{getOptionDisplay(option)}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        {isOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  }

  // Full expanded style for edit pages
  return (
    <div>
      <div className="text-sm font-medium text-slate-300 mb-2">{title}</div>
      <div className="border border-gray-600 rounded-md p-3 bg-gray-800">
        <div className="mb-2">
          <button
            type="button"
            onClick={clearAllOptions}
            className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear
          </button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {options.length === 0 ? (
            <div className="text-slate-500 text-sm italic">{noValueSetName}</div>
          ) : (
            options.map((option) => (
              <label
                key={getOptionKey(option)}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-700 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={() => handleToggleOption(option)}
                  className="rounded border-gray-500 bg-gray-700 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-200">{getOptionDisplay(option)}</span>
              </label>
            ))
          )}
        </div>
        {selectedOptions.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="text-xs text-slate-400">
              Selected: {selectedOptions.map(getOptionDisplay).join(", ")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};