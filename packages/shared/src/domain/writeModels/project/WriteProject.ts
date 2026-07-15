import type { ProjectSlug } from "@shared/domain/readModels/project/ProjectDetails";
import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import { z } from "zod";

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
