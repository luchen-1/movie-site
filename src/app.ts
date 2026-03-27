import compression from "compression";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { config } from "./config.js";
import { registerWebRoutes } from "./routes/web.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.set("view engine", "ejs");
  app.set("views", config.viewsDir);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(morgan("dev"));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(config.publicDir, { maxAge: "1h" }));

  app.locals.appName = config.appName;

  registerWebRoutes(app);

  return app;
}
