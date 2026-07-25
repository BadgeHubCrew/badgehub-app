import { PostgreSQLBadgeHubFiles } from "@db/PostgreSQLBadgeHubFiles";
import { PostgreSQLBadgeHubMetadata } from "@db/PostgreSQLBadgeHubMetadata";
import { BadgeHubData } from "@domain/BadgeHubData";
import {
  ProjectAlreadyExistsError,
  RoleAuthorizationError,
  UserError,
} from "@domain/UserError";
import { implement } from "@orpc/server";
import { privateRestContracts } from "@shared/contracts/privateRestContracts";
import { publicRestContracts } from "@shared/contracts/publicRestContracts";
import { getAllCategoryNames } from "@shared/domain/readModels/project/Category";
import type { ProjectLatestRevisions } from "@shared/domain/readModels/project/ProjectRevision";
import { parseAuth, requireAuth } from "./auth";
import { assertProjectAccess, assertUserAccess } from "./authorization";
import type { AppContext } from "./context";
import { badRequest, conflict, forbidden, notFound } from "./errors";
import { fileResponseHeaders, toFileBody } from "./fileResponse";

const publicOs = implement(publicRestContracts).$context<AppContext>();
// Middleware typings from standalone helpers are wider than Implementer's; cast is safe.
const privateOs = implement(privateRestContracts)
  .$context<AppContext>()
  // biome-ignore lint/suspicious/noExplicitAny: oRPC middleware generic variance
  .use(parseAuth as any)
  // biome-ignore lint/suspicious/noExplicitAny: oRPC middleware generic variance
  .use(requireAuth as any);

export function createApiRouter(
  badgeHubData: BadgeHubData = new BadgeHubData(
    new PostgreSQLBadgeHubMetadata(),
    new PostgreSQLBadgeHubFiles()
  )
) {
  const getProject = publicOs.getProject.handler(async ({ input }) => {
    const details = await badgeHubData.getProject(input.slug, "latest");
    if (!details) {
      notFound(`No public app with slug '${input.slug}' found`);
    }
    return details;
  });

  const getProjectSummaries = publicOs.getProjectSummaries.handler(
    async ({ input }) => {
      const projectSlugs = input.slugs?.split(",") || [];
      const knownCategoryNames = getAllCategoryNames();
      const excludeCategories = input.excludeCategories
        ?.split(",")
        .map((category) => category.trim())
        .filter((category) => knownCategoryNames.includes(category));
      return badgeHubData.getProjectSummaries(
        {
          slugs: projectSlugs,
          pageStart: input.pageStart,
          pageLength: input.pageLength,
          badge: input.badge,
          category: input.category,
          excludeCategories,
          search: input.search,
          userId: input.userId,
          orderBy: input.orderBy ?? "published_at",
          developmentStatus: input.developmentStatus,
        },
        "latest"
      );
    }
  );

  const getProjectLatestRevisions = publicOs.getProjectLatestRevisions.handler(
    async ({ input }) => {
      const slugs = input.slugs?.split(",") || undefined;
      const data = await badgeHubData.getProjectSummaries(
        { slugs, orderBy: "published_at" },
        "latest"
      );
      const projectRevisionMap: ProjectLatestRevisions = data.map((p) => ({
        slug: p.slug,
        revision: p.revision,
      }));
      return projectRevisionMap;
    }
  );

  const getProjectLatestRevision = publicOs.getProjectLatestRevision.handler(
    async ({ input }) => {
      const projectDetails = await badgeHubData.getProject(
        input.slug,
        "latest"
      );
      if (projectDetails?.latest_revision == null) {
        notFound(`No published app with slug '${input.slug}' found`);
      }
      return projectDetails.latest_revision;
    }
  );

  const getProjectForRevision = publicOs.getProjectForRevision.handler(
    async ({ input }) => {
      const details = await badgeHubData.getProject(input.slug, input.revision);
      if (!details) {
        notFound(
          `No public app with slug [${input.slug}] and revision [${input.revision}] found`
        );
      }
      return details;
    }
  );

  const getLatestPublishedFile = publicOs.getLatestPublishedFile.handler(
    async ({ input }) => {
      const [file, fileMetadata] = await Promise.all([
        badgeHubData.getFileContents(input.slug, "latest", input.filePath),
        badgeHubData.getFileMetadata(input.slug, "latest", input.filePath),
      ]);
      if (!file) {
        notFound(`No app with slug '${input.slug}' found`);
      }
      return {
        headers: fileResponseHeaders(input.filePath, fileMetadata?.mimetype),
        body: toFileBody(file, input.filePath, fileMetadata?.mimetype),
      };
    }
  );

  const getFileForRevision = publicOs.getFileForRevision.handler(
    async ({ input }) => {
      const [file, fileMetadata] = await Promise.all([
        badgeHubData.getFileContents(
          input.slug,
          input.revision,
          input.filePath
        ),
        badgeHubData.getFileMetadata(
          input.slug,
          input.revision,
          input.filePath
        ),
      ]);
      if (!file) {
        notFound(
          `No app with slug '${input.slug}' and revision '${input.revision}' found`
        );
      }
      return {
        headers: {
          ...fileResponseHeaders(input.filePath, fileMetadata?.mimetype),
          "cache-control": "public, max-age=31536000, immutable",
        },
        body: toFileBody(file, input.filePath, fileMetadata?.mimetype),
      };
    }
  );

  const getCategories = publicOs.getCategories.handler(async () =>
    badgeHubData.getCategories()
  );

  const getBadges = publicOs.getBadges.handler(async () =>
    badgeHubData.getBadges()
  );

  const ping = publicOs.ping.handler(async ({ input }) => {
    if (input.id) {
      await badgeHubData.registerBadge(input.id, input.mac);
    }
    return "pong";
  });

  const getStats = publicOs.getStats.handler(async () =>
    badgeHubData.getStats()
  );

  const reportInstall = publicOs.reportInstall.handler(async ({ input }) => {
    await badgeHubData.reportInstall(
      input.params.slug,
      input.params.revision,
      input.query
    );
  });

  const reportLaunch = publicOs.reportLaunch.handler(async ({ input }) => {
    await badgeHubData.reportLaunch(
      input.params.slug,
      input.params.revision,
      input.query
    );
  });

  const reportCrash = publicOs.reportCrash.handler(async ({ input }) => {
    await badgeHubData.reportCrash(
      input.params.slug,
      input.params.revision,
      input.query,
      input.body ?? {}
    );
  });

  const reportRatingFromBadge = publicOs.reportRatingFromBadge.handler(
    async ({ input }) => {
      await badgeHubData.reportRatingFromBadge(
        input.params.slug,
        input.params.revision,
        input.query,
        input.body
      );
    }
  );

  const createProject = privateOs.createProject.handler(
    async ({ input, context }) => {
      if (!context.user) {
        forbidden("No user in request");
      }
      const { slug, ...props } = input;
      try {
        await badgeHubData.insertProject({
          ...props,
          slug,
          idp_user_id: context.user.idp_user_id,
        });
      } catch (e) {
        if (e instanceof ProjectAlreadyExistsError) {
          conflict(e.message);
        }
        if (e instanceof UserError) {
          badRequest(e.message);
        }
        throw e;
      }
    }
  );

  const reportRatingFromUser = privateOs.reportRatingFromUser.handler(
    async ({ input, context }) => {
      assertUserAccess(input.userId, context.user);
      await badgeHubData.reportRatingFromUser(input.projectSlug, input.userId, {
        rating: input.rating,
      });
    }
  );

  const getRatingFromUser = privateOs.getRatingFromUser.handler(
    async ({ input, context }) => {
      assertUserAccess(input.userId, context.user);
      return badgeHubData.getRatingFromUser(input.projectSlug, input.userId);
    }
  );

  const updateProject = privateOs.updateProject.handler(
    async ({ input, context }) => {
      const { slug, ...body } = input;
      await assertProjectAccess(badgeHubData, slug, context);
      await badgeHubData.updateProject(slug, body);
    }
  );

  const deleteProject = privateOs.deleteProject.handler(
    async ({ input, context }) => {
      await assertProjectAccess(badgeHubData, input.slug, context);
      await badgeHubData.deleteProject(input.slug);
    }
  );

  const writeDraftFile = privateOs.writeDraftFile.handler(
    async ({ input, context }) => {
      await assertProjectAccess(badgeHubData, input.slug, context);
      const file = input.file;
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        await badgeHubData.writeDraftFile(
          input.slug,
          input.filePath,
          {
            mimetype: file.type || "application/octet-stream",
            fileContent: buffer,
            directory: "",
            fileName: file.name,
            size: file.size,
          },
          context.user
        );
      } catch (error) {
        if (error instanceof RoleAuthorizationError) {
          forbidden(error.message);
        }
        if (error instanceof UserError) {
          badRequest(error.message);
        }
        throw error;
      }
    }
  );

  const setDraftIconFromFile = privateOs.setDraftIconFromFile.handler(
    async ({ input, context }) => {
      const project = await assertProjectAccess(
        badgeHubData,
        input.slug,
        context
      );
      try {
        const iconPaths = await badgeHubData.setDraftIconFromFile(
          input.slug,
          input.filePath,
          input.sizes,
          context.user,
          project
        );
        if (!iconPaths) {
          notFound(
            `File '${input.filePath}' not found in draft project '${input.slug}'`
          );
        }
        return { iconPaths };
      } catch (error) {
        if (error instanceof UserError) {
          badRequest(error.message);
        }
        throw error;
      }
    }
  );

  const deleteDraftFile = privateOs.deleteDraftFile.handler(
    async ({ input, context }) => {
      await assertProjectAccess(badgeHubData, input.slug, context);
      await badgeHubData.deleteDraftFile(input.slug, input.filePath);
    }
  );

  const changeDraftAppMetadata = privateOs.changeDraftAppMetadata.handler(
    async ({ input, context }) => {
      const { slug, ...metadata } = input;
      await assertProjectAccess(badgeHubData, slug, context);
      try {
        await badgeHubData.updateDraftMetadata(slug, metadata, context.user);
      } catch (error) {
        if (error instanceof RoleAuthorizationError) {
          forbidden(error.message);
        }
        if (error instanceof UserError) {
          badRequest(error.message);
        }
        throw error;
      }
    }
  );

  const getDraftFile = privateOs.getDraftFile.handler(
    async ({ input, context }) => {
      await assertProjectAccess(badgeHubData, input.slug, context);
      const [fileContents, fileMetadata] = await Promise.all([
        badgeHubData.getFileContents(input.slug, "draft", input.filePath),
        badgeHubData.getFileMetadata(input.slug, "draft", input.filePath),
      ]);
      if (!fileContents) {
        notFound(
          `Project with slug '${input.slug}' or file '${input.filePath}' not found`
        );
      }
      return {
        headers: fileResponseHeaders(input.filePath, fileMetadata?.mimetype),
        body: toFileBody(fileContents, input.filePath, fileMetadata?.mimetype),
      };
    }
  );

  const getDraftProject = privateOs.getDraftProject.handler(
    async ({ input, context }) => {
      const project = await badgeHubData.getProject(input.slug, "draft");
      if (!project) {
        notFound(`No project with slug '${input.slug}' found`);
      }
      await assertProjectAccess(badgeHubData, input.slug, context, project);
      return project;
    }
  );

  const publishVersion = privateOs.publishVersion.handler(
    async ({ input, context }) => {
      await assertProjectAccess(badgeHubData, input.slug, context);
      await badgeHubData.publishVersion(input.slug);
    }
  );

  const createProjectAPIToken = privateOs.createProjectAPIToken.handler(
    async ({ input, context }) => {
      await assertProjectAccess(badgeHubData, input.slug, context);
      const token = await badgeHubData.createProjectApiToken(input.slug);
      return { token };
    }
  );

  const getProjectApiTokenMetadata =
    privateOs.getProjectApiTokenMetadata.handler(async ({ input, context }) => {
      await assertProjectAccess(badgeHubData, input.slug, context);
      const metadata = await badgeHubData.getProjectApiTokenMetadata(
        input.slug
      );
      if (!metadata) {
        notFound("No Project API");
      }
      return {
        last_used_at: metadata.last_used_at,
        created_at: metadata.created_at,
      };
    });

  const revokeProjectAPIToken = privateOs.revokeProjectAPIToken.handler(
    async ({ input, context }) => {
      await assertProjectAccess(badgeHubData, input.slug, context);
      await badgeHubData.revokeProjectAPIToken(input.slug);
    }
  );

  const getUserDraftProjects = privateOs.getUserDraftProjects.handler(
    async ({ input, context }) => {
      assertUserAccess(input.userId, context.user);
      return badgeHubData.getProjectSummaries(
        {
          pageStart: input.pageStart,
          pageLength: input.pageLength,
          userId: input.userId,
          orderBy: "updated_at",
        },
        "draft"
      );
    }
  );

  return {
    ...publicOs.router({
      getProject,
      getProjectSummaries,
      getProjectLatestRevisions,
      getProjectLatestRevision,
      getProjectForRevision,
      getLatestPublishedFile,
      getFileForRevision,
      getCategories,
      getBadges,
      ping,
      getStats,
      reportInstall,
      reportLaunch,
      reportCrash,
      reportRatingFromBadge,
    }),
    ...privateOs.router({
      createProject,
      getRatingFromUser,
      reportRatingFromUser,
      updateProject,
      deleteProject,
      writeDraftFile,
      setDraftIconFromFile,
      deleteDraftFile,
      changeDraftAppMetadata,
      getDraftFile,
      getDraftProject,
      publishVersion,
      createProjectAPIToken,
      getProjectApiTokenMetadata,
      revokeProjectAPIToken,
      getUserDraftProjects,
    }),
  };
}

export type ApiRouter = ReturnType<typeof createApiRouter>;
