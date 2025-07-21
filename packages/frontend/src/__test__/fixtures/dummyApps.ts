import {
  ProjectDetails,
  ProjectSummary,
} from "@shared/domain/readModels/project/ProjectDetails.ts";

type DummyData = {
  slug: string;
  name: string;
  description: string;
  categories: string[];
  published_at: Date;
  revision: number;
  badges: string[];
};

const dummyData: DummyData[] = [
  {
    slug: "dummy-app-1",
    name: "Dummy App 1",
    description: "A test app",
    categories: ["Silly"],
    published_at: new Date(),
    revision: 1,
    badges: ["mch2022", "why2025"],
  },
  {
    slug: "dummy-app-2",
    name: "Dummy Game App 2",
    description: "Another test app",
    categories: ["Silly"],
    published_at: new Date(),
    revision: 1,
    badges: ["troopers23"],
  },
  {
    slug: "dummy-app-3",
    name: "Dummy Game App 3",
    description: "Yet another test app",
    categories: ["Silly"],
    published_at: new Date(),
    revision: 1,
    badges: ["troopers23", "why2025"],
  },
  {
    slug: "dummy-app-4",
    name: "Dummy App 4",
    description: "Wearable device app",
    categories: ["Games"],
    published_at: new Date(),
    revision: 1,
    badges: [],
  },
  {
    slug: "dummy-app-5",
    name: "Dummy App 5",
    description: "Pagination test app 5",
    categories: ["Games"],
    published_at: new Date(),
    revision: 1,
    badges: [],
  },
  {
    slug: "dummy-app-6",
    name: "Dummy App 6",
    description: "Pagination test app 6",
    categories: ["Games"],
    published_at: new Date(),
    revision: 1,
    badges: [],
  },
  {
    slug: "dummy-app-7",
    name: "Dummy App 7",
    description: "Pagination test app 7",
    categories: ["Games"],
    published_at: new Date(),
    revision: 1,
    badges: [],
  },
  {
    slug: "dummy-app-8",
    name: "Dummy App 8",
    description: "Pagination test app 8",
    categories: ["Games"],
    published_at: new Date(),
    revision: 1,
    badges: [],
  },
  {
    slug: "dummy-app-9",
    name: "Dummy App 9",
    description: "Pagination test app 9",
    categories: ["Games"],
    published_at: new Date(),
    revision: 1,
    badges: [],
  },
  {
    slug: "dummy-app-10",
    name: "Dummy App 10",
    description: "Pagination test app 10",
    categories: ["Games"],
    published_at: new Date(),
    revision: 1,
    badges: [],
  },
  {
    slug: "dummy-app-11",
    name: "Dummy Game App 11",
    description: "Pagination test app 11",
    categories: ["Games"],
    published_at: new Date(),
    revision: 1,
    badges: [],
  },
  {
    slug: "dummy-app-12",
    name: "Dummy App 12",
    description: "Pagination test app 12",
    categories: ["Games"],
    published_at: new Date(),
    revision: 1,
    badges: [],
  },
  {
    slug: "dummy-app-13",
    name: "Dummy App 13",
    description: "Pagination test app 13",
    categories: ["Games"],
    published_at: new Date(),
    revision: 1,
    badges: [],
  },
  {
    slug: "dummy-app-14",
    name: "Dummy App 14",
    description: "Pagination test app 14",
    categories: ["Games"],
    published_at: new Date(),
    revision: 1,
    badges: [],
  },
  {
    slug: "dummy-app-15",
    name: "Dummy App 15",
    description: "Pagination test app 15",
    categories: ["Games"],
    published_at: new Date(),
    revision: 1,
    badges: [],
  },
];

const toSummary = (dummyApp: DummyData): ProjectSummary => {
  return {
    ...dummyApp,
    license_type: "MIT",
    idp_user_id: "dummy-user-id",
  };
};

const toDetails = (dummyApp: DummyData): ProjectDetails => {
  const { slug, revision, published_at, ...app_metadata } = dummyApp;
  return {
    idp_user_id: "dummy-user-id",
    slug,
    created_at: published_at,
    updated_at: published_at,
    version: {
      revision,
      download_count: 0,
      files: [],
      project_slug: slug,
      published_at,
      created_at: published_at,
      updated_at: published_at,
      app_metadata: {
        ...app_metadata,
        license_type: "MIT",
      },
    },
  };
};

export type DummyApp = { summary: ProjectSummary; details: ProjectDetails };
export const dummyApps: DummyApp[] = dummyData.map((app) => ({
  summary: toSummary(app),
  details: toDetails(app),
}));
