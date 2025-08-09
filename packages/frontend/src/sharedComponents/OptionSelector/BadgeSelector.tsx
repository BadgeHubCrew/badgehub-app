import React from "react";
import { BadgeSlug } from "@shared/domain/readModels/Badge.ts";
import { OptionSelectorWithTitle } from "@sharedComponents/OptionSelector/OptionSelectorWithTitle.tsx";
import { MultiSelectWithTitle } from "@sharedComponents/OptionSelector/MultiSelectWithTitle.tsx";
import { BADGE_SLUGS } from "@config.ts";

// Single-select props
interface SingleSelectProps {
  multiSelect?: false;
  badge: BadgeSlug | undefined;
  onBadgeChange: (selectedBadge: BadgeSlug | undefined) => void;
  noValueSetName: string;
}

// Multi-select props  
interface MultiSelectProps {
  multiSelect: true;
  badges: BadgeSlug[];
  onBadgesChange: (selectedBadges: BadgeSlug[]) => void;
  noValueSetName: string;
  compact?: boolean; // For filter vs edit page styling
}

type BadgeSelectorProps = SingleSelectProps | MultiSelectProps;

export const BadgeSelector: React.FC<BadgeSelectorProps> = (props) => {
  const availableBadges = BADGE_SLUGS || [];

  // Single-select mode (existing behavior)
  if (!props.multiSelect) {
    const valueMap = Object.fromEntries(availableBadges.map((slug) => [slug, slug]));
    return (
      <OptionSelectorWithTitle
        noValueSetName={props.noValueSetName}
        title="Badge"
        valueMap={valueMap}
        value={props.badge}
        onValueSelection={props.onBadgeChange}
      />
    );
  }

  // Multi-select mode using the abstraction
  return (
    <MultiSelectWithTitle
      title="Badge"
      options={availableBadges}
      selectedOptions={props.badges}
      onOptionsChange={props.onBadgesChange}
      noValueSetName={props.noValueSetName}
      compact={props.compact}
      testId="badge-dropdown"
    />
  );
};
