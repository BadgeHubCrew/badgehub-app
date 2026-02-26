import initSqlJs, { type Database } from "sql.js";

const API_PREFIX = "/api/v3";

let installed = false;

const textEncoder = new TextEncoder();

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function noContent(): Response {
  return new Response(null, { status: 204 });
}

function parsePath(url: URL): string {
  return url.pathname.replace(/\/+$/, "") || "/";
}

function seed(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      badges TEXT NOT NULL,
      authorId TEXT NOT NULL,
      publishedRevision INTEGER NOT NULL DEFAULT 1,
      draftRevision INTEGER NOT NULL DEFAULT 2,
      metadataJson TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS project_files (
      slug TEXT NOT NULL,
      revision INTEGER NOT NULL,
      filePath TEXT NOT NULL,
      content TEXT NOT NULL,
      PRIMARY KEY (slug, revision, filePath)
    );
  `);

  const now = new Date().toISOString();
  const metadata = {
    name: "Demo App",
    description: "Preview app backed by in-browser sqlite",
    category: "tools",
    badges: ["fri3d-badge"],
    author: "preview-user",
    tags: ["preview"],
  };

  db.run(
    `INSERT OR IGNORE INTO projects (slug, name, description, category, badges, authorId, metadataJson, updatedAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "demo-app",
      "Demo App",
      "Preview app backed by in-browser sqlite",
      "tools",
      JSON.stringify(["fri3d-badge"]),
      "preview-user",
      JSON.stringify(metadata),
      now,
      now,
    ],
  );

  db.run(
    `INSERT OR IGNORE INTO project_files (slug, revision, filePath, content) VALUES (?, ?, ?, ?)`,
    ["demo-app", 1, "main.py", "print('hello from github pages preview')\n"],
  );
}

function firstRow<T extends Record<string, unknown>>(db: Database, sql: string, params: unknown[] = []): T | null {
  const stmt = db.prepare(sql, params);
  try {
    if (!stmt.step()) return null;
    return stmt.getAsObject() as T;
  } finally {
    stmt.free();
  }
}

function allRows<T extends Record<string, unknown>>(db: Database, sql: string, params: unknown[] = []): T[] {
  const stmt = db.prepare(sql, params);
  const out: T[] = [];
  try {
    while (stmt.step()) out.push(stmt.getAsObject() as T);
  } finally {
    stmt.free();
  }
  return out;
}

function getProjectSummary(row: Record<string, unknown>) {
  return {
    slug: row.slug,
    app_metadata_json: JSON.parse(String(row.metadataJson)),
    latest_published_revision: Number(row.publishedRevision),
    latest_draft_revision: Number(row.draftRevision),
    updated_at: String(row.updatedAt),
    created_at: String(row.createdAt),
    idp_user_id: String(row.authorId),
  };
}

function getProjectDetails(row: Record<string, unknown>) {
  return {
    ...getProjectSummary(row),
    files: [],
  };
}

async function createBackendDb(): Promise<Database> {
  const SQL = await initSqlJs({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/sql.js@1.12.0/dist/${file}`,
  });
  const db = new SQL.Database();
  seed(db);
  return db;
}

export async function installBrowserBackendIfNeeded() {
  const enabled = import.meta.env.VITE_ENABLE_BROWSER_BACKEND === "true";
  if (!enabled || installed) return;

  const db = await createBackendDb();
  const realFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url, window.location.origin);

    if (!url.pathname.startsWith(API_PREFIX)) {
      return realFetch(input, init);
    }

    const path = parsePath(url);
    const method = request.method.toUpperCase();

    if (method === "GET" && path === `${API_PREFIX}/ping`) {
      return new Response("pong", { status: 200 });
    }

    if (method === "GET" && path === `${API_PREFIX}/badges`) {
      return jsonResponse(200, ["fri3d-badge"]);
    }

    if (method === "GET" && path === `${API_PREFIX}/categories`) {
      return jsonResponse(200, ["tools"]);
    }

    if (method === "GET" && path === `${API_PREFIX}/stats`) {
      return jsonResponse(200, { total_projects: 1, total_installs: 0 });
    }

    if (method === "GET" && path === `${API_PREFIX}/project-summaries`) {
      const projects = allRows(db, "SELECT * FROM projects ORDER BY updatedAt DESC").map(getProjectSummary);
      return jsonResponse(200, projects);
    }

    const projectMatch = path.match(/^\/api\/v3\/projects\/([^/]+)$/);
    if (projectMatch && method === "GET") {
      const slug = decodeURIComponent(projectMatch[1]);
      const row = firstRow(db, "SELECT * FROM projects WHERE slug = ?", [slug]);
      if (!row) return jsonResponse(404, { reason: "Project not found" });
      return jsonResponse(200, getProjectDetails(row));
    }

    if (projectMatch && method === "POST") {
      const slug = decodeURIComponent(projectMatch[1]);
      const body = (await request.json()) as Record<string, unknown>;
      const now = new Date().toISOString();
      const metadata = {
        name: body.name ?? slug,
        description: body.description ?? "",
        category: body.category ?? "tools",
        badges: body.badges ?? ["fri3d-badge"],
        author: "preview-user",
      };
      db.run(
        `INSERT INTO projects (slug, name, description, category, badges, authorId, metadataJson, updatedAt, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          slug,
          String(metadata.name),
          String(metadata.description),
          String(metadata.category),
          JSON.stringify(metadata.badges),
          "preview-user",
          JSON.stringify(metadata),
          now,
          now,
        ],
      );
      return noContent();
    }

    const draftMatch = path.match(/^\/api\/v3\/projects\/([^/]+)\/draft$/);
    if (draftMatch && method === "GET") {
      const slug = decodeURIComponent(draftMatch[1]);
      const row = firstRow(db, "SELECT * FROM projects WHERE slug = ?", [slug]);
      if (!row) return jsonResponse(404, { reason: "Project not found" });
      return jsonResponse(200, getProjectDetails(row));
    }

    const publishMatch = path.match(/^\/api\/v3\/projects\/([^/]+)\/publish$/);
    if (publishMatch && method === "PATCH") {
      const slug = decodeURIComponent(publishMatch[1]);
      db.run(
        "UPDATE projects SET publishedRevision = draftRevision, draftRevision = draftRevision + 1, updatedAt = ? WHERE slug = ?",
        [new Date().toISOString(), slug],
      );
      return noContent();
    }

    const latestFileMatch = path.match(/^\/api\/v3\/projects\/([^/]+)\/latest\/files\/(.+)$/);
    if (latestFileMatch && method === "GET") {
      const slug = decodeURIComponent(latestFileMatch[1]);
      const filePath = decodeURIComponent(latestFileMatch[2]);
      const project = firstRow<{ publishedRevision: number }>(db, "SELECT publishedRevision FROM projects WHERE slug = ?", [slug]);
      if (!project) return jsonResponse(404, { reason: "Project not found" });
      const file = firstRow<{ content: string }>(
        db,
        "SELECT content FROM project_files WHERE slug = ? AND revision = ? AND filePath = ?",
        [slug, project.publishedRevision, filePath],
      );
      if (!file) return jsonResponse(404, { reason: "File not found" });
      return new Response(textEncoder.encode(file.content), { status: 200 });
    }

    return jsonResponse(501, { reason: `Browser backend route not implemented: ${method} ${path}` });
  };

  installed = true;
}
