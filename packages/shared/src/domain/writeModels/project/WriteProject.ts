import type { ProjectSlug } from "@shared/domain/readModels/project/ProjectDetails";
import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import { z } from "zod";

export interface CreateProjectProps {
  slug: ProjectSlug; // The directory name of this project
  idp_user_id: string;
}

export const createProjectPropsSchema = z.object({
  slug: z.string(),
  idp_user_id: z.string(),
});

__tsCheckSame<
  CreateProjectProps,
  CreateProjectProps,
  z.infer<typeof createProjectPropsSchema>
>(true);
