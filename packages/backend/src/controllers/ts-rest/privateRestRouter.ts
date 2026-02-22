import multer from "multer";

import { initServer } from "@ts-rest/express";
import { BadgeHubData } from "@domain/BadgeHubData";
import { createBadgeHubData } from "@domain/createBadgeHubData";
import {
  HTTP_FORBIDDEN,
  HTTP_NOT_FOUND,
  noContent,
  nok,
  ok,
} from "@controllers/ts-rest/httpResponses";
import {
  privateProjectContracts,
  privateRestContracts,
} from "@shared/contracts/privateRestContracts";
import { RouterImplementation } from "@ts-rest/express/src/lib/types";
import {
  getUser,
  AuthenticatedRequest,
  UserDataInRequest,
} from "@auth/jwt-decode";
import {
  ProjectDetails,
  ProjectSlug,
} from "@shared/domain/readModels/project/ProjectDetails";
import { Readable } from "node:stream";
import { MAX_UPLOAD_FILE_SIZE_BYTES } from "@config";
import { ProjectAlreadyExistsError, UserError } from "@domain/UserError";
import { detectMimeType } from "@util/mimeTypeDetection";

const upload = multer({
  limits: { fileSize: MAX_UPLOAD_FILE_SIZE_BYTES },
});

const createProjectRouter = (badgeHubData: BadgeHubData) => {
  const privateProjectRouter: RouterImplementation<
    typeof privateProjectContracts
  > = {
    createProject: async ({ params: { slug }, req, body: props }) => {
      // Create a new draft project using the user from the token.
      const user = getUser(req as unknown as AuthenticatedRequest);
      if (!user) {
        throw nok(403, "No user in request");
      }
      try {
        await badgeHubData.insertProject({
          ...props,
          slug,
          idp_user_id: user.idp_user_id,
        });
      } catch (e) {
        if (e instanceof ProjectAlreadyExistsError) {
          return nok(409, e.message);
        }
        if (e instanceof UserError) {
          return nok(400, e.message);
        }
      }
      return noContent();
    },

    updateProject: async ({ params: { slug }, body, req }) => {
      const authorizationFailureResponse = await checkProjectAuthorization(
        badgeHubData,
        slug,
        req
      );
      if (authorizationFailureResponse) return authorizationFailureResponse;
      await badgeHubData.updateProject(slug, body);
      return noContent();
    },

    deleteProject: async ({ params: { slug }, req }) => {
      const authorizationFailureResponse = await checkProjectAuthorization(
        badgeHubData,
        slug,
        req
      );
      if (authorizationFailureResponse) return authorizationFailureResponse;
      // Delete the project.
      await badgeHubData.deleteProject(slug);
      return noContent();
    },

    changeDraftAppMetadata: async ({ params: { slug }, body, req }) => {
      const authorizationFailureResponse = await checkProjectAuthorization(
        badgeHubData,
        slug,
        req
      );
      if (authorizationFailureResponse) return authorizationFailureResponse;
      // Update metadata for the draft version of the project.
      await badgeHubData.updateDraftMetadata(slug, body);
      return noContent();
    },

    getDraftProject: async ({ params: { slug }, req }) => {
      const project = await badgeHubData.getProject(slug, "draft");
      if (!project) {
        return nok(HTTP_NOT_FOUND, `No project with slug '${slug}' found`);
      }
      const authorizationFailureResponse = await checkProjectAuthorization(
        badgeHubData,
        slug,
        req,
        project
      );
      if (authorizationFailureResponse) return authorizationFailureResponse;

      return ok(project);
    },

    publishVersion: async ({ params: { slug }, req }) => {
      const authorizationFailureResponse = await checkProjectAuthorization(
        badgeHubData,
        slug,
        req
      );
      if (authorizationFailureResponse) return authorizationFailureResponse;
      await badgeHubData.publishVersion(slug);
      return noContent();
    },

    writeDraftFile: {
      middleware: [upload.single("file")],
      handler: async ({ params: { slug, filePath }, file, req }) => {
        const authorizationFailureResponse = await checkProjectAuthorization(
          badgeHubData,
          slug,
          req
        );
        if (authorizationFailureResponse) return authorizationFailureResponse;
        // Write a file to the draft version of the project.

        let typedFile = file as Express.Multer.File | undefined;
        if (!typedFile?.buffer) {
          return nok(
            400,
            "No file provided with multipart/form-data under field file"
          );
        }
        const detectedMimeType = detectMimeType(typedFile.mimetype, filePath);

        await badgeHubData.writeDraftFile(slug, filePath, {
          mimetype: detectedMimeType,
          fileContent: typedFile.buffer,
          directory: typedFile.destination,
          fileName: typedFile.filename,
          size: typedFile.size,
        });
        return noContent();
      },
    },

    setDraftIconFromFile: async ({ params: { slug }, body, req }) => {
      const project = await badgeHubData.getProject(slug, "draft");
      if (!project) {
        return nok(HTTP_NOT_FOUND, `No project with slug '${slug}' found`);
      }
      const authorizationFailureResponse = await checkProjectAuthorization(
        badgeHubData,
        slug,
        req,
        project
      );
      if (authorizationFailureResponse) return authorizationFailureResponse;

      try {
        const iconPaths = await badgeHubData.setDraftIconFromFile(
          slug,
          body.filePath,
          body.sizes,
          project
        );
        if (!iconPaths) {
          return nok(
            HTTP_NOT_FOUND,
            `File '${body.filePath}' not found in draft project '${slug}'`
          );
        }
        return ok({ iconPaths });
      } catch (error) {
        if (error instanceof UserError) {
          return nok(400, error.message);
        }
        throw error;
      }
    },

    deleteDraftFile: async ({ params: { slug, filePath }, req }) => {
      const authorizationFailureResponse = await checkProjectAuthorization(
        badgeHubData,
        slug,
        req
      );
      if (authorizationFailureResponse) return authorizationFailureResponse;
      // Delete a file from the draft version of the project.
      await badgeHubData.deleteDraftFile(slug, filePath);
      return noContent();
    },

    getDraftFile: async ({ params: { slug, filePath }, req }) => {
      const authorizationFailureResponse = await checkProjectAuthorization(
        badgeHubData,
        slug,
        req
      );
      if (authorizationFailureResponse) return authorizationFailureResponse;
      // Get the file contents for the draft version of the project.
      const fileContents = await badgeHubData.getFileContents(
        slug,
        "draft",
        filePath
      );
      if (!fileContents) {
        return nok(
          HTTP_NOT_FOUND,
          `Project with slug '${slug}' or file '${filePath}' not found`
        );
      }
      return ok(Readable.from(fileContents));
    },

    createProjectAPIToken: async ({ params: { slug }, req }) => {
      const authorizationFailureResponse = await checkProjectAuthorization(
        badgeHubData,
        slug,
        req
      );
      if (authorizationFailureResponse) return authorizationFailureResponse;
      const token = await badgeHubData.createProjectApiToken(slug);
      return ok({ token });
    },

    getProjectApiTokenMetadata: async ({ params: { slug }, req }) => {
      const authorizationFailureResponse = await checkProjectAuthorization(
        badgeHubData,
        slug,
        req
      );
      if (authorizationFailureResponse) return authorizationFailureResponse;
      const metadata = await badgeHubData.getProjectApiTokenMetadata(slug);
      if (!metadata) {
        return nok(404, "No Project API");
      }
      return ok({
        last_used_at: metadata.last_used_at ?? metadata.created_at,
        created_at: metadata.created_at,
      });
    },

    revokeProjectAPIToken: async ({ params: { slug }, req }) => {
      const authorizationFailureResponse = await checkProjectAuthorization(
        badgeHubData,
        slug,
        req
      );
      if (authorizationFailureResponse) return authorizationFailureResponse;
      await badgeHubData.revokeProjectAPIToken(slug);
      return noContent();
    },
  };
  return privateProjectRouter;
};
export const createPrivateRestRouter = (
  badgeHubData: BadgeHubData = createBadgeHubData()
) => {
  const s = initServer();

  return s.router(privateRestContracts, {
    ...createProjectRouter(badgeHubData),
    getUserDraftProjects: async ({
      params: { userId },
      query: { pageStart, pageLength },
      req,
    }) => {
      const nokResponse = checkUserAuthorization(userId, req);
      if (nokResponse) {
        return nokResponse;
      }
      const projects = await badgeHubData.getProjectSummaries(
        { pageStart, pageLength, userId, orderBy: "updated_at" },
        "draft"
      );
      return ok(projects);
    },
  });
};

const requestIsFromAllowedUser = (
  request: {
    user: UserDataInRequest;
  },
  { allowedUsers }: { allowedUsers: string[] }
) => {
  const user = getUser(request);
  return user && allowedUsers.includes(user.idp_user_id);
};

const checkUserAuthorization = (userId: string, request: any) => {
  if (
    !requestIsFromAllowedUser(request, {
      allowedUsers: [userId],
    })
  ) {
    return nok(
      HTTP_FORBIDDEN,
      `You are not allowed to access the draft projects of user with id '${userId}'`
    );
  }
};

const checkProjectAuthorization = async (
  badgeHubData: BadgeHubData,
  slug: ProjectSlug,
  request: unknown,
  project?: ProjectDetails
) => {
  project = project ?? (await badgeHubData.getProject(slug, "draft"));
  if (!project) {
    return nok(HTTP_NOT_FOUND, `No project with slug '${slug}' found`);
  }
  const authenticatedRequest = request as AuthenticatedRequest;
  // Handle API token authentication (if API token is provided)
  if (authenticatedRequest.apiToken) {
    const tokenIsValidForProject = await badgeHubData.checkApiToken(
      slug,
      authenticatedRequest.apiToken
    );
    return tokenIsValidForProject
      ? undefined
      : nok(
          HTTP_FORBIDDEN,
          `The given badgehub-api-token not authorized for project with slug '${slug}'`
        );
  }

  // If no user authentication is present, deny access
  if (!authenticatedRequest.user) {
    return nok(HTTP_FORBIDDEN, "No authentication provided");
  }

  // Handle user authentication
  if (
    !requestIsFromAllowedUser(
      authenticatedRequest,
      {
        allowedUsers: [project?.idp_user_id],
      }
    )
  ) {
    return nok(
      HTTP_FORBIDDEN,
      `The user in the JWT token is not authorized for project with slug '${slug}'`
    );
  }
  return;
};
