import { z } from "zod/v3";
import { __tsCheckSame } from "@badgehub/shared/zodUtils/zodTypeComparison";
import type { ProjectSlug } from "@badgehub/shared/domain/readModels/project/ProjectDetails";

export interface CreateProjectProps {
  slug: ProjectSlug; // The directory name of this project
  git?: string; // repository url
  idp_user_id: string;
}

export const createProjectPropsSchema = z.object({
  git: z.string().optional(),
  slug: z.string(),
  idp_user_id: z.string(),
});

__tsCheckSame<
  CreateProjectProps,
  CreateProjectProps,
  z.infer<typeof createProjectPropsSchema>
>(true);
