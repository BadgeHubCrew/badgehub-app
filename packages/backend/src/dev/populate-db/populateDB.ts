import pg from "pg";
import {
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PASSWORD,
  POSTGRES_PORT,
  POSTGRES_USER,
} from "#config";
import sql, { raw } from "sql-template-tag";
import { BadgeHubData } from "#domain/BadgeHubData";
import { PostgreSQLBadgeHubMetadata } from "#db/PostgreSQLBadgeHubMetadata";
import { PostgreSQLBadgeHubFiles } from "#db/PostgreSQLBadgeHubFiles";
import { stringToSemiRandomNumber } from "#dev/populate-db/stringToSemiRandomNumber";

import { BADGE_IDS, PROJECT_NAMES, USERS } from "#dev/populate-db/fixtures";
import {
  createSemiRandomAppdata,
  get1DayAfterSemiRandomUpdatedAt,
  getSemiRandomDates,
} from "#dev/populate-db/createSemiRandomAppdata";

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
  const pool = new pg.Pool({
    host: POSTGRES_HOST,
    database: POSTGRES_DB,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    port: POSTGRES_PORT,
  });
  const client: pg.PoolClient = await pool.connect();
  const badgeHubData = new BadgeHubData(
    new PostgreSQLBadgeHubMetadata(),
    new PostgreSQLBadgeHubFiles()
  );
  try {
    await cleanTables(client);
    const projectSlugs = await insertProjects(badgeHubData);
    const publishedProjectSlugs = await publishSomeProjects(
      badgeHubData,
      projectSlugs
    );
    await registerMostBadges(badgeHubData);
    await reportSomeDownloads(badgeHubData, publishedProjectSlugs);
  } finally {
    client.release();
  }
}

async function cleanTables(client: pg.PoolClient) {
  const tablesWithoutIdSeq = ["projects", "registered_badges"];
  for (const table of tablesWithoutIdSeq) {
    await client.query(sql`delete
                           from ${raw(table)}`);
  }

  const tablesWithIdSeq = [
    "files",
    "file_data",
    "versions",
    "registered_badges_version_reports",
  ];
  for (const table of tablesWithIdSeq) {
    await client.query(sql`delete
                           from ${raw(table)}`);
    await client
      .query(sql`alter sequence ${raw(table)}_id_seq restart`)
      .catch((e) => {
        console.warn(`could not reset ${table}_id_seq, ignoring issue`, e);
      });
  }
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
