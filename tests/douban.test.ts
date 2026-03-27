import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseDoubanNowPlayingHtml } from "../src/services/douban.js";

describe("parseDoubanNowPlayingHtml", () => {
  it("extracts now-playing movie cards from the Douban page", () => {
    const fixture = fs.readFileSync(
      path.join(process.cwd(), "tests", "fixtures", "douban-nowplaying.html"),
      "utf8"
    );

    const movies = parseDoubanNowPlayingHtml(fixture, "shanghai");

    expect(movies).toHaveLength(1);
    expect(movies[0]).toMatchObject({
      externalId: "36463719",
      title: "编号17",
      doubanRating: 7.1,
      doubanVotes: 180246,
      director: "奉俊昊",
      sourceCity: "shanghai",
    });
  });
});
