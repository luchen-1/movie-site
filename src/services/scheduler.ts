import cron from "node-cron";

import { config } from "../config.js";
import { syncNowPlayingMovies } from "./sync.js";

let schedulerStarted = false;

export function startScheduler(): void {
  if (schedulerStarted || !config.syncEnabled) {
    return;
  }

  schedulerStarted = true;

  cron.schedule(
    config.syncCron,
    async () => {
      const result = await syncNowPlayingMovies();
      console.log(`[scheduler] ${result.status}: ${result.message}`);
    },
    { timezone: config.timezone }
  );

  if (config.syncOnStartup) {
    setTimeout(() => {
      void syncNowPlayingMovies().then((result) => {
        console.log(`[startup-sync] ${result.status}: ${result.message}`);
      });
    }, 250);
  }
}
