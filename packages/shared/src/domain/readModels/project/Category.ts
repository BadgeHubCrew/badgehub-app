import { z } from "zod/v3";
import { getSharedConfig } from "@badgehub/shared/config/sharedConfig";

const sharedConfig = getSharedConfig();
// TODO this could cause issues if imported too early (before dotenv config)
export const categoryNameSchema = z.enum(getAllCategoryNames());
export type CategoryName = string;

export function getAllCategoryNames(): [CategoryName, ...CategoryName[]] {
  return [...sharedConfig.CATEGORY_NAMES, ...sharedConfig.ADMIN_CATEGORY_NAMES];
}

export function getAdminOnlyCategoryNames(): [CategoryName, ...CategoryName[]] {
  return sharedConfig.ADMIN_CATEGORY_NAMES;
}

export function isAdminCategory(category: CategoryName) {
  return sharedConfig.ADMIN_CATEGORY_NAMES.includes(category);
}
