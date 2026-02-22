import type { IconSize } from "@badgehub/shared/domain/readModels/project/AppMetadataJSON";
import { UserError } from "#domain/UserError";

export type ImageDimensions = { image_width: number; image_height: number };
export const parseIconSize = (size: IconSize): ImageDimensions => {
  const [value] = size.split("x");
  const numericSize = Number(value);
  if (!Number.isFinite(numericSize) || numericSize <= 0) {
    throw new UserError(`Invalid icon size '${size}'.`);
  }
  return {
    image_width: numericSize,
    image_height: numericSize,
  };
};
