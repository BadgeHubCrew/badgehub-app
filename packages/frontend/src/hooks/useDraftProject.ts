import { useEffect, useState } from "react";
import Keycloak from "keycloak-js";
import { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import { getFreshAuthorizedTsRestClient } from "@api/tsRestClient.ts";
import { useAsyncResource } from "@hooks/useAsyncResource.ts";
import {
  DraftProjectErrorCode,
  draftProjectErrorFromStatus,
  normalizeDraftProjectError,
} from "@utils/draftProjectErrors.ts";

export type PossiblyStaleProject = ProjectDetails & { stale?: true };

export const useDraftProject = (slug: string, keycloak?: Keycloak) => {
  const [project, setProject] = useState<PossiblyStaleProject | null>(null);
  const shouldFetchProject = Boolean(keycloak) && (!project || project.stale);
  const { data: fetchedProject, error: fetchError, loading } = useAsyncResource(
    async () => {
      if (!keycloak) {
        throw new Error("authentication");
      }
      try {
        const res = await (
          await getFreshAuthorizedTsRestClient(keycloak)
        ).getDraftProject({
          params: { slug },
        });
        if (res.status === 200) {
          return res.body;
        }
        throw new Error(draftProjectErrorFromStatus(res.status));
      } catch (error) {
        console.error("Failed to fetch draft project:", error);
        if (!keycloak.authenticated) {
          throw new Error("authentication");
        }
        throw new Error(normalizeDraftProjectError(error));
      }
    },
    [keycloak, project?.stale, slug],
    { enabled: shouldFetchProject }
  );

  useEffect(() => {
    if (fetchedProject) {
      setProject(fetchedProject);
    }
  }, [fetchedProject]);

  const error: DraftProjectErrorCode | null = !keycloak
    ? "authentication"
    : fetchError
      ? normalizeDraftProjectError(fetchError)
      : null;

  return { project, setProject, loading, error };
};
