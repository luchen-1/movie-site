import https from "node:https";

import { db } from "../db.js";

type PosterCacheEntry = {
  body: Buffer;
  contentType: string;
  expiresAt: number;
};

const posterCache = new Map<string, PosterCacheEntry>();
const POSTER_TTL_MS = 1000 * 60 * 60 * 6;

async function downloadPoster(url: string): Promise<{ body: Buffer; contentType: string } | null> {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: {
          Referer: "https://movie.douban.com/",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36",
        },
      },
      (res) => {
        if (!res.statusCode || res.statusCode >= 400) {
          res.resume();
          resolve(null);
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        res.on("end", () => {
          resolve({
            body: Buffer.concat(chunks),
            contentType: res.headers["content-type"] ?? "image/jpeg",
          });
        });
      }
    );

    req.on("error", () => resolve(null));
    req.setTimeout(15000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

export async function getPosterByExternalId(
  externalId: string
): Promise<{ body: Buffer; contentType: string } | null> {
  const cached = posterCache.get(externalId);

  if (cached && cached.expiresAt > Date.now()) {
    return { body: cached.body, contentType: cached.contentType };
  }

  const movie = db
    .prepare("SELECT cover_url FROM movies WHERE external_id = ? LIMIT 1")
    .get(externalId) as { cover_url: string } | undefined;

  if (!movie?.cover_url) {
    return null;
  }

  const downloaded = await downloadPoster(movie.cover_url);

  if (!downloaded) {
    return null;
  }

  const entry = {
    body: downloaded.body,
    contentType: downloaded.contentType,
    expiresAt: Date.now() + POSTER_TTL_MS,
  };

  posterCache.set(externalId, entry);

  return { body: entry.body, contentType: entry.contentType };
}
