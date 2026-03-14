import path from "path";
import { stringToSemiRandomNumber } from "@dev/populate-db/stringToSemiRandomNumber";
import {
  CATEGORY_NAMES,
  ICON_COUNT,
  ICON_FILENAMES,
  ICONS_ASSETS_PATH,
  SIX_HUNDRED_DAYS_IN_MS,
  TWENTY_FOUR_HOURS_IN_MS,
  USERS,
} from "@dev/populate-db/fixtures";
import sharp from "sharp";
import { getBadgeSlugs } from "@shared/domain/readModels/Badge";
import { AppMetadataJSON } from "@shared/domain/readModels/project/AppMetadataJSON";
import { TimestampTZ } from "@db/models/DBTypes";
import { ISODateString } from "@shared/domain/readModels/ISODateString";

export const getSemiRandomDates = async (stringToDigest: string) => {
  const semiRandomNumber = await stringToSemiRandomNumber(stringToDigest);
  const createMillisBack = semiRandomNumber % SIX_HUNDRED_DAYS_IN_MS;
  const created_at = date(createMillisBack) as TimestampTZ;

  const updated_at = date(
    createMillisBack -
      Math.min(
        0,
        createMillisBack - (semiRandomNumber % (1234 * TWENTY_FOUR_HOURS_IN_MS))
      )
  ) as TimestampTZ;
  return { created_at, updated_at };
};
export const get1DayAfterSemiRandomUpdatedAt = async (projectSlug: string) => {
  return new Date(
    Date.parse((await getSemiRandomDates(projectSlug)).updated_at) +
      TWENTY_FOUR_HOURS_IN_MS
  ).toISOString() as ISODateString;
};

function date(millisBackFrom2025: number) {
  const JAN_FIRST_2025_BRUSSELS = 1_735_686_000_000;
  const MAX_DATE_MILLIS = JAN_FIRST_2025_BRUSSELS;
  return new Date(MAX_DATE_MILLIS - millisBackFrom2025).toISOString();
}

function getSemiRandomElementSelection<T>(
  semiRandomNumber: number,
  items: T[],
  max_items: number
): T[] {
  const nbItems = Math.max(semiRandomNumber % max_items, 1);
  const selection = new Set<T>();
  for (let i = 0; i < nbItems; i++) {
    selection.add(items[(i + semiRandomNumber) % items.length]!);
  }
  return [...selection];
}

export async function createSemiRandomAppdata(
  projectName: string,
  semanticVersion: string
) {
  const semiRandomNumber = await stringToSemiRandomNumber(projectName);
  const projectSlug = projectName.toLowerCase();
  const userId = semiRandomNumber % USERS.length;
  const description = await getDescription(projectName);
  const longDescription = await getLongDescription(projectName, description);

  const { created_at, updated_at } = await getSemiRandomDates(projectName);

  let iconBuffer: Buffer | undefined = undefined;

  // Pick a semirandom icon
  const iconIndex = semiRandomNumber % (ICON_COUNT + 4);
  const iconFilename = ICON_FILENAMES[iconIndex];
  const iconRelativePath = iconFilename;
  if (iconFilename) {
    const iconFullPath = path.join(ICONS_ASSETS_PATH, iconFilename);

    // Read icon file from disk
    try {
      iconBuffer = await sharp(iconFullPath).resize(64, 64).toBuffer();
    } catch (e) {
      console.warn(`Could not read icon file: ${iconFullPath}`);
    }
  }

  const categories = getSemiRandomElementSelection(
    semiRandomNumber,
    CATEGORY_NAMES,
    3
  );
  const allBadges = getBadgeSlugs();
  const badges = getSemiRandomElementSelection(
    semiRandomNumber,
    allBadges,
    allBadges.length
  );
  const appMetadata: AppMetadataJSON = {
    name: projectName,
    description,
    long_description: longDescription,
    author: USERS[userId]!,
    license_type: "MIT",
    badges,
    categories,
    icon_map: iconRelativePath ? { "64x64": iconRelativePath } : undefined,
  };
  if (semiRandomNumber % 2 === 0) {
    appMetadata.git_url = "https://github.com/badgehubcrew/badgehub-app";
  } else if (semiRandomNumber % 3 === 0) {
    appMetadata.git_url = "https://gitlab.com/team-badge/badgevms-badgehub";
  }
  if (semiRandomNumber % 2 === 0) {
    appMetadata.hidden = false;
  }
  if (semiRandomNumber % 9 === 0) {
    appMetadata.hidden = true;
  }
  if (semanticVersion !== "") {
    appMetadata.version = semanticVersion;
  }
  return {
    projectSlug,
    created_at,
    updated_at,
    iconBuffer,
    iconRelativePath,
    appMetadata,
  };
}

async function getDescription(appName: string) {
  switch ((await stringToSemiRandomNumber(appName)) % 4) {
    case 0:
      return `Use ${appName} for some cool graphical effects.`;
    case 1:
      return `With ${appName}, you can do interesting things with the sensors.`;
    case 2:
      return `Make some magic happen with ${appName}.`;
    case 3:
      return `${appName} is just some silly test app.`;
  }
}

async function getLongDescription(
  appName: string,
  shortDescription: string | undefined
) {
  const semiRandomNumber = await stringToSemiRandomNumber(appName);
  // Deterministic 50% coverage, similar to the rest of the semirandom fixtures.
  if (semiRandomNumber % 2 !== 0) {
    return undefined;
  }

  return `${shortDescription}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. ${appName} posuere orci sed odio faucibus, vitae varius velit faucibus. Integer tempus, nisl eu porttitor fermentum, purus nibh hendrerit velit, quis volutpat dolor felis eu sem.

Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ${appName} facilisis nunc id lorem bibendum, non congue neque elementum.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;
}
