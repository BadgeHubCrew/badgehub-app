import { BadgeHubData } from "@domain/BadgeHubData";
import { createBadgeHubData } from "@domain/createBadgeHubData";
import { REFRESH_REPORTS_INTERVAL_SEC } from "@config";

export const startRefreshReportsInterval = (
  badgeHubData: BadgeHubData = createBadgeHubData()
) => {
  if (process.env.NODE_APP_INSTANCE && process.env.NODE_APP_INSTANCE !== "0") {
    return;
  }
  setInterval(
    () => {
      badgeHubData.refreshReports().catch((e) => {
        console.error("RefreshReportsInterval: refreshReports failed", e);
      });
    },
    Number(REFRESH_REPORTS_INTERVAL_SEC) * 1000
  );
};
