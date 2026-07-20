import type { OrderByOption } from "@shared/domain/readModels/project/ordering.ts";
import type { SortOption } from "@sharedComponents/AppsGrid/Filters.tsx";
import type React from "react";

const NO_FILTER_OPTION_VALUE = "All";
export const OptionSelectorWithTitle: React.FC<
  {
    title: string;
    noValueSetName: string;
  } & (
    | {
        valueMap: Record<string, string>;
        value: string | undefined;
        onValueSelection: (newValue: string) => void;
      }
    | {
        valueMap: Partial<Record<OrderByOption, string>>;
        value: SortOption;
        onValueSelection: (value: SortOption) => void;
      }
  )
> = ({ title, noValueSetName, valueMap, value, onValueSelection }) => {
  const selectionId = `${title.toLowerCase()}-dropdown`;
  return (
    <div className={valueMap ? "" : "todoElement"}>
      <label htmlFor={selectionId} className="label">
        <span className="label-text">{title}</span>
      </label>
      <select
        id={selectionId}
        name={selectionId}
        data-testid={selectionId}
        className="select select-sm select-bordered w-full"
        value={value === undefined ? NO_FILTER_OPTION_VALUE : String(value)}
        onChange={(e) => {
          const selected =
            e.target.value === NO_FILTER_OPTION_VALUE
              ? undefined
              : e.target.value;
          // Union of onValueSelection handlers; filter-clear passes undefined.
          (onValueSelection as (value: string | typeof selected) => void)(
            selected
          );
        }}
      >
        <option value={NO_FILTER_OPTION_VALUE}>{noValueSetName}</option>
        {(Object.keys(valueMap ?? {}) as Array<keyof typeof valueMap>).map(
          (option) => (
            <option key={option} value={option}>
              {valueMap?.[option]}
            </option>
          )
        )}
      </select>
    </div>
  );
};
