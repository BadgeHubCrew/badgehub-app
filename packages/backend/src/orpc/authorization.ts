import type { UserDataInRequest } from "@auth/jwt-decode";
import type { BadgeHubData } from "@domain/BadgeHubData";
import type {
  ProjectDetails,
  ProjectSlug,
} from "@shared/domain/readModels/project/ProjectDetails";
import type { AuthContext } from "./context";
import { forbidden, notFound } from "./errors";

export async function assertProjectAccess(
  badgeHubData: BadgeHubData,
  slug: ProjectSlug,
  auth: AuthContext,
  project?: ProjectDetails | null
): Promise<ProjectDetails> {
  const resolved = project ?? (await badgeHubData.getProject(slug, "draft"));
  if (!resolved) {
    notFound(`No project with slug '${slug}' found`);
  }

  if (auth.apiToken) {
    const ok = await badgeHubData.checkApiToken(slug, auth.apiToken);
    if (!ok) {
      forbidden(
        `The given badgehub-api-token not authorized for project with slug '${slug}'`
      );
    }
    return resolved;
  }

  if (!auth.user) {
    forbidden("No authentication provided");
  }

  if (auth.user.idp_user_id !== resolved.idp_user_id) {
    forbidden(
      `The user in the JWT token is not authorized for project with slug '${slug}'`
    );
  }

  return resolved;
}

export function assertUserAccess(
  userId: string,
  user: UserDataInRequest | undefined
) {
  if (!user || user.idp_user_id !== userId) {
    forbidden(
      `You are not allowed to access the draft projects of user with id '${userId}'`
    );
  }
}
