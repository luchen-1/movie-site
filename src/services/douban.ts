import * as cheerio from "cheerio";

import { config } from "../config.js";
import type { ScrapedMovie } from "../types.js";

const DOUBAN_BASE_URL = "https://movie.douban.com";

function parseNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function absoluteUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return new URL(value, DOUBAN_BASE_URL).toString();
}

export function parseDoubanNowPlayingHtml(html: string, city: string): ScrapedMovie[] {
  const $ = cheerio.load(html);
  const movies: ScrapedMovie[] = [];

  $("#nowplaying li.list-item").each((_, element) => {
    const item = $(element);

    if (item.attr("data-category") !== "nowplaying") {
      return;
    }

    const externalId = item.attr("data-subject")?.trim() ?? item.attr("id")?.trim();
    const title = item.attr("data-title")?.trim() ?? item.find(".stitle a").attr("title")?.trim();
    const doubanUrl =
      absoluteUrl(item.find(".stitle a").attr("href")?.split("?")[0]) ??
      absoluteUrl(item.find(".poster a").attr("href")?.split("?")[0]);
    const coverUrl = absoluteUrl(item.attr("data-cover_url")) ?? absoluteUrl(item.find("img").attr("src"));

    if (!externalId || !title || !doubanUrl || !coverUrl) {
      return;
    }

    const releaseDate = item.attr("data-release")?.trim() || item.find(".release-date").text().trim() || null;

    movies.push({
      externalId,
      title,
      coverUrl,
      doubanUrl,
      ticketUrl:
        absoluteUrl(item.attr("data-ticket_uri")) ??
        absoluteUrl(item.find(".sbtn a").attr("href")),
      doubanRating: parseNumber(item.attr("data-score")),
      doubanVotes: parseNumber(item.attr("data-votecount")),
      releaseDate,
      duration: item.attr("data-duration")?.trim() ?? null,
      regions: item.attr("data-region")?.trim() ?? null,
      genres: item.attr("data-types")?.trim() ?? item.attr("data-type")?.trim() ?? null,
      director: item.attr("data-director")?.trim() ?? null,
      actors: item.attr("data-actors")?.trim() ?? null,
      synopsis: item.attr("data-intro")?.trim() ?? null,
      sourceCity: city,
    });
  });

  return movies;
}

export async function fetchDoubanNowPlaying(city = config.doubanCity): Promise<ScrapedMovie[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(`${DOUBAN_BASE_URL}/cinema/nowplaying/${city}/`, {
      headers: {
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Douban request failed with ${response.status}`);
    }

    const html = await response.text();
    return parseDoubanNowPlayingHtml(html, city);
  } finally {
    clearTimeout(timeout);
  }
}
