import { createApp } from "./app.js";
import { config } from "./config.js";
import { startScheduler } from "./services/scheduler.js";

const app = createApp();

app.listen(config.port, () => {
  console.log(`${config.appName} listening on http://localhost:${config.port}`);
});

startScheduler();
