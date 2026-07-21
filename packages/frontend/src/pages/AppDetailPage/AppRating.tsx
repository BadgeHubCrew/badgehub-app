import type { ApiClient } from "@api/apiClient.ts";
import { getAuthorizationHeader } from "@api/apiClient.ts";
import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import { useSession } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import type React from "react";
import { useEffect, useState } from "react";

const ratingOptions = [1, 2, 3, 4, 5] as const;

const StarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.31l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.94L12 2.5z" />
  </svg>
);

const AppRating: React.FC<{
  apiClient: ApiClient;
  project: ProjectDetails;
}> = ({ apiClient, project }) => {
  const { user, keycloak } = useSession();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isLoadingRating, setIsLoadingRating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"saved" | "error" | null>(
    null
  );

  useEffect(() => {
    if (!user || !keycloak) {
      setSelectedRating(null);
      return;
    }

    let cancelled = false;
    setIsLoadingRating(true);
    void (async () => {
      const response = await apiClient.getRatingFromUser({
        params: { userId: user.id, projectSlug: project.slug },
        headers: await getAuthorizationHeader(keycloak),
      });
      if (cancelled) {
        return;
      }
      setIsLoadingRating(false);
      if (response.status === 200) {
        setSelectedRating(response.body?.rating ?? null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiClient, keycloak, project.slug, user]);

  if (!user || !keycloak) {
    return null;
  }

  const submitRating = async (rating: number) => {
    setSelectedRating(rating);
    setIsSubmitting(true);
    setSubmitState(null);
    const response = await apiClient.reportRatingFromUser({
      params: { userId: user.id, projectSlug: project.slug },
      body: { rating },
      headers: await getAuthorizationHeader(keycloak),
    });
    setIsSubmitting(false);
    setSubmitState(response.status === 204 ? "saved" : "error");
  };

  return (
    <section className="card bg-base-200 shadow-lg">
      <div className="card-body p-6">
        <h2 className="text-xl font-semibold mb-4 border-b border-base-300 pb-2">
          Rate this app
        </h2>
        <div className="flex items-center gap-1">
          {ratingOptions.map((rating) => (
            <button
              key={rating}
              type="button"
              className={`transition-colors ${
                selectedRating != null && rating <= selectedRating
                  ? "text-warning"
                  : "text-base-content/30 hover:text-warning/70"
              }`}
              aria-label={`Rate ${rating} out of 5`}
              disabled={isLoadingRating || isSubmitting}
              onClick={() => void submitRating(rating)}
            >
              <StarIcon />
            </button>
          ))}
        </div>
        {submitState === "saved" && (
          <p className="text-sm text-success">Rating saved.</p>
        )}
        {submitState === "error" && (
          <p className="text-sm text-error">Could not save rating.</p>
        )}
      </div>
    </section>
  );
};

export default AppRating;
