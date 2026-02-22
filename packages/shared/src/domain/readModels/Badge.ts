import { z } from "zod/v3";
import { __tsCheckSame } from "@badgehub/shared/zodUtils/zodTypeComparison";
import { getSharedConfig } from "@badgehub/shared/config/sharedConfig";

export type BadgeSlug = string;

export const badgeSlugSchema = z.enum(getBadgeSlugs()).describe("badge slug");

export function getBadgeSlugs(): [BadgeSlug, ...BadgeSlug[]] {
  return getSharedConfig().BADGE_SLUGS;
}

__tsCheckSame<BadgeSlug, BadgeSlug, z.infer<typeof badgeSlugSchema>>(true);
