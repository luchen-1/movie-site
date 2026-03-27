import { config } from "../config.js";
import { db } from "../db.js";
import type { ScrapedMovie, SyncResult } from "../types.js";
import { fetchDoubanNowPlaying } from "./douban.js";

const insertLog = db.prepare(`
  INSERT INTO sync_logs (started_at, status, message, fetched_count, upserted_count, deactivated_count)
  VALUES (?, ?, ?, 0, 0, 0)
`);

const finishLog = db.prepare(`
  UPDATE sync_logs
  SET finished_at = ?, status = ?, message = ?, fetched_count = ?, upserted_count = ?, deactivated_count = ?
  WHERE id = ?
`);

const upsertMovie = db.prepare(`
  INSERT INTO movies (
    external_id,
    title,
    cover_url,
    douban_url,
    ticket_url,
    douban_rating,
    douban_votes,
    release_date,
    duration,
    regions,
    genres,
    director,
    actors,
    synopsis,
    source_city,
    is_active,
    last_source_update_at,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  ON CONFLICT(external_id) DO UPDATE SET
    title = excluded.title,
    cover_url = excluded.cover_url,
    douban_url = excluded.douban_url,
    ticket_url = excluded.ticket_url,
    douban_rating = excluded.douban_rating,
    douban_votes = excluded.douban_votes,
    release_date = excluded.release_date,
    duration = excluded.duration,
    regions = excluded.regions,
    genres = excluded.genres,
    director = excluded.director,
    actors = excluded.actors,
    synopsis = excluded.synopsis,
    source_city = excluded.source_city,
    is_active = 1,
    last_source_update_at = excluded.last_source_update_at,
    updated_at = excluded.updated_at
`);

const deactivateMovies = db.prepare(`
  UPDATE movies
  SET is_active = 0, updated_at = ?
  WHERE source_city = ? AND is_active = 1
`);

let activeSync: Promise<SyncResult> | null = null;

function writeMovies(movies: ScrapedMovie[]): { upsertedCount: number; deactivatedCount: number } {
  const now = new Date().toISOString();
  const previousRows = db
    .prepare("SELECT external_id FROM movies WHERE source_city = ? AND is_active = 1")
    .all(config.doubanCity) as Array<{ external_id: string }>;

  const previousIds = new Set(previousRows.map((row) => row.external_id));
  const fetchedIds = new Set(movies.map((movie) => movie.externalId));

  const transaction = db.transaction((items: ScrapedMovie[]) => {
    deactivateMovies.run(now, config.doubanCity);

    for (const movie of items) {
      upsertMovie.run(
        movie.externalId,
        movie.title,
        movie.coverUrl,
        movie.doubanUrl,
        movie.ticketUrl,
        movie.doubanRating,
        movie.doubanVotes,
        movie.releaseDate,
        movie.duration,
        movie.regions,
        movie.genres,
        movie.director,
        movie.actors,
        movie.synopsis,
        movie.sourceCity,
        now,
        now
      );
    }
  });

  transaction(movies);

  let deactivatedCount = 0;
  for (const previousId of previousIds) {
    if (!fetchedIds.has(previousId)) {
      deactivatedCount += 1;
    }
  }

  return {
    upsertedCount: movies.length,
    deactivatedCount,
  };
}

async function performSync(): Promise<SyncResult> {
  const startedAt = new Date().toISOString();
  const log = insertLog.run(startedAt, "running", `Syncing Douban ${config.doubanCity} now-playing feed`);

  try {
    const movies = await fetchDoubanNowPlaying(config.doubanCity);
    const { upsertedCount, deactivatedCount } = writeMovies(movies);
    const finishedAt = new Date().toISOString();
    const message = `Synced ${movies.length} movies from Douban ${config.doubanCity}`;

    finishLog.run(
      finishedAt,
      "success",
      message,
      movies.length,
      upsertedCount,
      deactivatedCount,
      Number(log.lastInsertRowid)
    );

    return {
      startedAt,
      finishedAt,
      fetchedCount: movies.length,
      upsertedCount,
      deactivatedCount,
      status: "success",
      message,
    };
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const message = error instanceof Error ? error.message : "Unknown sync error";

    finishLog.run(finishedAt, "failed", message, 0, 0, 0, Number(log.lastInsertRowid));

    return {
      startedAt,
      finishedAt,
      fetchedCount: 0,
      upsertedCount: 0,
      deactivatedCount: 0,
      status: "failed",
      message,
    };
  }
}

export async function syncNowPlayingMovies(): Promise<SyncResult> {
  if (!activeSync) {
    activeSync = performSync().finally(() => {
      activeSync = null;
    });
  }

  return activeSync;
}
