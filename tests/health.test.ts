import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type AppModule = typeof import("../src/app.js");
type DbModule = typeof import("../src/db.js");

describe("GET /healthz", () => {
  let createApp: AppModule["createApp"];
  let closeDatabase: DbModule["closeDatabase"];

  beforeEach(async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "cinepulse-render-health-"));

    process.env.DATA_DIR = tempDir;
    process.env.DB_PATH = path.join(tempDir, "cinepulse.db");

    vi.resetModules();

    ({ closeDatabase } = await import("../src/db.js"));
    ({ createApp } = await import("../src/app.js"));
  });

  afterEach(() => {
    closeDatabase();
    delete process.env.DATA_DIR;
    delete process.env.DB_PATH;
    vi.resetModules();
  });

  it("returns 200 when the sqlite database is ready", async () => {
    const response = await request(createApp()).get("/healthz");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      city: "shanghai",
      database: true,
    });
  });
});
