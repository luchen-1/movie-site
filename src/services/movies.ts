import { db } from "../db.js";
import type { HomeStats, MovieCard, MovieDetail, ReviewView, SyncLogRecord } from "../types.js";

type ListMoviesOptions = {
  query?: string;
  sort?: string;
};

function normalizeQuery(input?: string): string {
  return input?.trim() ?? "";
}

export function listMovies(options: ListMoviesOptions = {}): MovieCard[] {
  const query = normalizeQuery(options.query);
  const sort = options.sort ?? "site";

  const sortClause =
    sort === "douban"
      ? "ORDER BY (m.douban_rating IS NULL), m.douban_rating DESC, review_count DESC, m.title ASC"
      : sort === "latest"
        ? "ORDER BY m.updated_at DESC, m.title ASC"
        : "ORDER BY (site_rating IS NULL), site_rating DESC, review_count DESC, m.douban_rating DESC, m.title ASC";

  const statement = db.prepare(`
    SELECT
      m.*,
      ROUND(AVG(r.rating), 1) AS site_rating,
      COUNT(r.id) AS review_count
    FROM movies m
    LEFT JOIN reviews r ON r.movie_id = m.id
    WHERE m.is_active = 1
      AND (
        ? = ''
        OR m.title LIKE '%' || ? || '%'
        OR COALESCE(m.director, '') LIKE '%' || ? || '%'
        OR COALESCE(m.actors, '') LIKE '%' || ? || '%'
        OR COALESCE(m.genres, '') LIKE '%' || ? || '%'
      )
    GROUP BY m.id
    ${sortClause}
  `);

  return statement.all(query, query, query, query, query) as MovieCard[];
}

export function getMovieDetail(externalId: string): MovieDetail | null {
  const statement = db.prepare(`
    SELECT
      m.*,
      ROUND(AVG(r.rating), 1) AS site_rating,
      COUNT(r.id) AS review_count
    FROM movies m
    LEFT JOIN reviews r ON r.movie_id = m.id
    WHERE m.external_id = ?
    GROUP BY m.id
    LIMIT 1
  `);

  return (statement.get(externalId) as MovieDetail | undefined) ?? null;
}

export function getMovieReviews(movieId: number): ReviewView[] {
  const statement = db.prepare(`
    SELECT id, movie_id, nickname, rating, comment, created_at
    FROM reviews
    WHERE movie_id = ?
    ORDER BY created_at DESC, id DESC
  `);

  const rows = statement.all(movieId) as Array<ReviewView>;

  return rows.map((review) => ({
    ...review,
    comment_html: review.comment
      ? review.comment
          .split("\n")
          .map((line) => line.trim())
          .join("<br>")
      : null,
  }));
}

export function getRecentReviews(limit = 6): Array<ReviewView & { movie_title: string; external_id: string }> {
  const statement = db.prepare(`
    SELECT
      r.id,
      r.movie_id,
      r.nickname,
      r.rating,
      r.comment,
      r.created_at,
      m.title AS movie_title,
      m.external_id
    FROM reviews r
    INNER JOIN movies m ON m.id = r.movie_id
    ORDER BY r.created_at DESC, r.id DESC
    LIMIT ?
  `);

  const rows = statement.all(limit) as Array<ReviewView & { movie_title: string; external_id: string }>;

  return rows.map((review) => ({
    ...review,
    comment_html: review.comment
      ? review.comment
          .split("\n")
          .map((line) => line.trim())
          .join("<br>")
      : null,
  }));
}

export function getHomeStats(): HomeStats {
  const activeMovieCount =
    (db.prepare("SELECT COUNT(*) AS count FROM movies WHERE is_active = 1").get() as { count: number }).count ?? 0;
  const reviewStats = db
    .prepare("SELECT COUNT(*) AS count, ROUND(AVG(rating), 1) AS average FROM reviews")
    .get() as { count: number; average: number | null };

  return {
    activeMovies: activeMovieCount,
    totalReviews: reviewStats.count ?? 0,
    averageSiteRating: reviewStats.average ?? null,
  };
}

export function getLatestSyncLog(): SyncLogRecord | null {
  const row = db
    .prepare("SELECT * FROM sync_logs ORDER BY started_at DESC, id DESC LIMIT 1")
    .get() as SyncLogRecord | undefined;

  return row ?? null;
}
