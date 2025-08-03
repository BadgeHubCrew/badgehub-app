import { z } from "zod/v3";
import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import { ProjectSlug } from "@shared/domain/readModels/project/ProjectDetails";

export type ProjectLatestRevision = {
  slug: ProjectSlug;
  revision: number;
};

const projectLatestRevisionSchema = z.object({
  slug: z.string(),
  revision: z.number(),
});

export const projectLatestRevisionsSchema = z.array(
  projectLatestRevisionSchema
);

export type ProjectLatestRevisions = ProjectLatestRevision[];
__tsCheckSame<
  ProjectLatestRevisions,
  ProjectLatestRevisions,
  z.infer<typeof projectLatestRevisionsSchema>
>(true);
