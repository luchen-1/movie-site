import type { Express, Request, Response } from "express";

import { config } from "../config.js";
import { checkDatabaseHealth } from "../db.js";
import {
  getHomeStats,
  getLatestSyncLog,
  getMovieDetail,
  getMovieReviews,
  getRecentReviews,
  listMovies,
} from "../services/movies.js";
import { getPosterByExternalId } from "../services/posters.js";
import { addReviewByExternalId } from "../services/reviews.js";
import { syncNowPlayingMovies } from "../services/sync.js";

function getFlash(query: Request["query"]): string | null {
  const flash = typeof query.flash === "string" ? query.flash : null;

  switch (flash) {
    case "review-saved":
      return "评论已发布，评分已经计入本站均分。";
    default:
      return null;
  }
}

function getError(query: Request["query"]): string | null {
  return typeof query.error === "string" ? query.error : null;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "未同步";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: config.timezone,
  }).format(date);
}

export function registerWebRoutes(app: Express): void {
  app.get("/", (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q : "";
    const sort = typeof req.query.sort === "string" ? req.query.sort : "site";

    res.render("pages/home", {
      title: `${config.appName} | 重新给正在上映电影打分`,
      currentPath: req.path,
      flash: getFlash(req.query),
      error: getError(req.query),
      filters: { query, sort },
      movies: listMovies({ query, sort }),
      stats: getHomeStats(),
      syncLog: getLatestSyncLog(),
      recentReviews: getRecentReviews(),
      formatDateTime,
    });
  });

  app.get("/movies/:externalId", (req, res) => {
    const movie = getMovieDetail(req.params.externalId);

    if (!movie) {
      res.status(404).render("pages/not-found", {
        title: `未找到影片 | ${config.appName}`,
        currentPath: req.path,
      });
      return;
    }

    res.render("pages/movie", {
      title: `${movie.title} | ${config.appName}`,
      currentPath: req.path,
      flash: getFlash(req.query),
      error: getError(req.query),
      movie,
      reviews: getMovieReviews(movie.id),
      formatDateTime,
    });
  });

  app.post("/movies/:externalId/reviews", (req, res) => {
    const result = addReviewByExternalId(req.params.externalId, req.body);

    if (!result.success) {
      res.redirect(`/movies/${req.params.externalId}?error=${encodeURIComponent(result.message)}#review-form`);
      return;
    }

    res.redirect(`/movies/${req.params.externalId}?flash=review-saved#reviews`);
  });

  app.get("/healthz", (_req, res) => {
    const now = new Date().toISOString();

    try {
      const database = checkDatabaseHealth();

      res.status(database ? 200 : 503).json({
        ok: database,
        city: config.doubanCity,
        database,
        now,
      });
    } catch {
      res.status(503).json({
        ok: false,
        city: config.doubanCity,
        database: false,
        now,
      });
    }
  });

  app.get("/api/movies", (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q : "";
    const sort = typeof req.query.sort === "string" ? req.query.sort : "site";

    res.json({
      items: listMovies({ query, sort }),
      stats: getHomeStats(),
      syncLog: getLatestSyncLog(),
    });
  });

  app.get("/posters/:externalId", async (req, res) => {
    const poster = await getPosterByExternalId(req.params.externalId);

    if (!poster) {
      res.status(404).end();
      return;
    }

    res.setHeader("Content-Type", poster.contentType);
    res.setHeader("Cache-Control", "public, max-age=21600");
    res.send(poster.body);
  });

  app.post("/api/sync", async (req: Request, res: Response) => {
    if (config.adminSyncToken) {
      const token = req.headers["x-sync-token"];
      if (token !== config.adminSyncToken) {
        res.status(401).json({ ok: false, message: "Invalid sync token" });
        return;
      }
    }

    const result = await syncNowPlayingMovies();
    res.status(result.status === "success" ? 200 : 500).json({ ok: result.status === "success", result });
  });

  app.use((req, res) => {
    res.status(404).render("pages/not-found", {
      title: `页面不存在 | ${config.appName}`,
      currentPath: req.path,
    });
  });
}
