import { getSqliteDb } from "@db/sqliteDatabase";
import { BadgeHubData } from "@domain/BadgeHubData";
import { createBadgeHubData } from "@domain/createBadgeHubData";
import { stringToSemiRandomNumber } from "@dev/populate-db/stringToSemiRandomNumber";

import { BADGE_IDS, PROJECT_NAMES, USERS } from "@dev/populate-db/fixtures";
import {
  createSemiRandomAppdata,
  get1DayAfterSemiRandomUpdatedAt,
  getSemiRandomDates,
} from "@dev/populate-db/createSemiRandomAppdata";

async function reportSomeDownloads(
  badgeHubData: BadgeHubData,
  projectNames: string[]
) {
  const projectsWithDownloads = projectNames
    .slice(0, -3)
    .map((projectName) => projectName.toLowerCase());
  const nbDownloads = 500;
  for (let i = 0; i < nbDownloads; i++) {
    const semiRandomIndex = await stringToSemiRandomNumber("download" + i);
    await badgeHubData.reportInstall(
      projectsWithDownloads[semiRandomIndex % projectsWithDownloads.length]!,
      1,
      { id: BADGE_IDS[i % BADGE_IDS.length >> 2] + "-v1" }
    );
  }
  await badgeHubData.refreshReports();
}

async function registerMostBadges(badgeHubData: BadgeHubData) {
  for (const badge_id of BADGE_IDS.slice(3)) {
    await badgeHubData.registerBadge(badge_id, undefined);
  }
}

export async function repopulateDB() {
  const badgeHubData = createBadgeHubData();
  await cleanTables();
  const projectSlugs = await insertProjects(badgeHubData);
  const publishedProjectSlugs = await publishSomeProjects(
    badgeHubData,
    projectSlugs
  );
  await registerMostBadges(badgeHubData);
  await reportSomeDownloads(badgeHubData, publishedProjectSlugs);
}

async function cleanTables() {
  const db = getSqliteDb();
  db.exec(`
    DELETE FROM event_reports;
    DELETE FROM files;
    DELETE FROM versions;
    DELETE FROM project_api_token;
    DELETE FROM registered_badges;
    DELETE FROM projects;
    DELETE FROM sqlite_sequence WHERE name IN ('event_reports', 'files', 'versions');
  `);
}

async function publishSomeProjects(
  badgeHubData: BadgeHubData,
  projectNames: string[]
) {
  const halfOfProjectNames = projectNames.slice(0, projectNames.length >> 1);
  await Promise.all(
    halfOfProjectNames.map(async (projectName) => {
      await badgeHubData.publishVersion(
        projectName.toLowerCase(),
        await get1DayAfterSemiRandomUpdatedAt(projectName)
      );
      await writeDraftAppFiles(badgeHubData, projectName, "0.0.1");
    })
  );
  return halfOfProjectNames;
}

const writeDraftAppFiles = async (
  badgeHubData: BadgeHubData,
  projectName: string,
  semanticVersion: string = ""
) => {
  const {
    projectSlug,
    created_at,
    updated_at,
    iconBuffer,
    iconRelativePath,
    appMetadata,
  } = await createSemiRandomAppdata(projectName, semanticVersion);

  const metadataJsonContent = Buffer.from(JSON.stringify(appMetadata));
  await badgeHubData.writeDraftFile(
    projectSlug,
    "metadata.json",
    {
      mimetype: "application/json",
      size: metadataJsonContent.length,
      fileContent: metadataJsonContent,
    },
    { created_at, updated_at }
  );

  // Upload the icon file if it exists
  if (iconRelativePath && iconBuffer) {
    await badgeHubData.writeDraftFile(
      projectSlug,
      iconRelativePath,
      {
        mimetype: "image/png",
        size: iconBuffer.length,
        fileContent: iconBuffer,
      },
      { created_at, updated_at }
    );
  }

  const initPyContent = Buffer.from(
    `print('Hello world from the ${projectName} app${semanticVersion}')`
  );
  await badgeHubData.writeDraftFile(
    projectSlug,
    "__init__.py",
    {
      mimetype: "text/x-python-script",
      size: initPyContent.length,
      fileContent: initPyContent,
    },
    { created_at, updated_at }
  );
};

async function insertProjects(badgeHubData: BadgeHubData) {
  for (const projectName of PROJECT_NAMES) {
    const semiRandomNumber = await stringToSemiRandomNumber(projectName);
    const slug = projectName.toLowerCase();
    const userName = USERS[semiRandomNumber % USERS.length]!;

    const { created_at, updated_at } = await getSemiRandomDates(projectName);

    await badgeHubData.insertProject(
      { slug, idp_user_id: userName },
      { created_at, updated_at }
    );
    await writeDraftAppFiles(badgeHubData, projectName);
  }

  return PROJECT_NAMES;
}
