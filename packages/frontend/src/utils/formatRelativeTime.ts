const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Formats an ISO timestamp as a short relative label (e.g. "just now", "2 minutes ago").
 * Pass `now` for deterministic tests.
 */
export const formatRelativeTime = (
  isoDate: string,
  now: Date = new Date()
): string => {
  const then = Date.parse(isoDate);
  if (Number.isNaN(then)) {
    return isoDate;
  }

  const diffMs = Math.max(0, now.getTime() - then);

  if (diffMs < MINUTE_MS) {
    return "just now";
  }

  if (diffMs < HOUR_MS) {
    const minutes = Math.floor(diffMs / MINUTE_MS);
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }

  if (diffMs < DAY_MS) {
    const hours = Math.floor(diffMs / HOUR_MS);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  const days = Math.floor(diffMs / DAY_MS);
  if (days < 30) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }

  return new Date(then).toLocaleDateString();
};
