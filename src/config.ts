import "dotenv/config";

import path from "node:path";

const port = Number(process.env.PORT ?? 3000);

export const config = {
  appName: "CinePulse",
  port: Number.isFinite(port) ? port : 3000,
  dataDir: process.env.DATA_DIR ?? path.join(process.cwd(), "data"),
  dbPath: process.env.DB_PATH ?? path.join(process.cwd(), "data", "cinepulse.db"),
  viewsDir: path.join(process.cwd(), "views"),
  publicDir: path.join(process.cwd(), "public"),
  doubanCity: process.env.DOUBAN_CITY ?? "shanghai",
  syncCron: process.env.DOUBAN_SYNC_CRON ?? "17 */6 * * *",
  timezone: process.env.APP_TIMEZONE ?? "Asia/Shanghai",
  syncOnStartup: process.env.SYNC_ON_STARTUP !== "false",
  syncEnabled: process.env.SYNC_ENABLED !== "false",
  adminSyncToken: process.env.ADMIN_SYNC_TOKEN ?? "",
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? 20000),
};
