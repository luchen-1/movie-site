import sanitizeHtml from "sanitize-html";
import { z } from "zod";

import { db } from "../db.js";

const reviewSchema = z.object({
  nickname: z.string().trim().min(2, "昵称至少 2 个字符").max(24, "昵称最多 24 个字符"),
  rating: z.coerce.number().int().min(1, "评分最低 1 分").max(10, "评分最高 10 分"),
  comment: z
    .string()
    .trim()
    .max(500, "评论最多 500 个字符")
    .optional()
    .transform((value) => value ?? "")
    .refine((value) => value.length === 0 || value.length >= 5, "评论至少 5 个字符，或留空"),
});

export function addReviewByExternalId(
  externalId: string,
  input: unknown
): { success: true } | { success: false; message: string } {
  const parsed = reviewSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "提交内容无效",
    };
  }

  const movie = db
    .prepare("SELECT id FROM movies WHERE external_id = ? LIMIT 1")
    .get(externalId) as { id: number } | undefined;

  if (!movie) {
    return {
      success: false,
      message: "电影不存在或已被移除",
    };
  }

  const nickname = sanitizeHtml(parsed.data.nickname, { allowedTags: [], allowedAttributes: {} }).trim();
  const comment = sanitizeHtml(parsed.data.comment, { allowedTags: [], allowedAttributes: {} }).trim();

  db.prepare(`
    INSERT INTO reviews (movie_id, nickname, rating, comment, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(movie.id, nickname, parsed.data.rating, comment.length > 0 ? comment : null, new Date().toISOString());

  return { success: true };
}
