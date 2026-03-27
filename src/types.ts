export interface MovieRecord {
  id: number;
  external_id: string;
  title: string;
  cover_url: string;
  douban_url: string;
  ticket_url: string | null;
  douban_rating: number | null;
  douban_votes: number | null;
  release_date: string | null;
  duration: string | null;
  regions: string | null;
  genres: string | null;
  director: string | null;
  actors: string | null;
  synopsis: string | null;
  source_city: string;
  is_active: number;
  last_source_update_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewRecord {
  id: number;
  movie_id: number;
  nickname: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface SyncLogRecord {
  id: number;
  started_at: string;
  finished_at: string | null;
  status: string;
  message: string | null;
  fetched_count: number;
  upserted_count: number;
  deactivated_count: number;
}

export interface MovieCard extends MovieRecord {
  site_rating: number | null;
  review_count: number;
}

export interface MovieDetail extends MovieRecord {
  site_rating: number | null;
  review_count: number;
}

export interface ReviewView extends ReviewRecord {
  comment_html: string | null;
}

export interface HomeStats {
  activeMovies: number;
  totalReviews: number;
  averageSiteRating: number | null;
}

export interface ScrapedMovie {
  externalId: string;
  title: string;
  coverUrl: string;
  doubanUrl: string;
  ticketUrl: string | null;
  doubanRating: number | null;
  doubanVotes: number | null;
  releaseDate: string | null;
  duration: string | null;
  regions: string | null;
  genres: string | null;
  director: string | null;
  actors: string | null;
  synopsis: string | null;
  sourceCity: string;
}

export interface SyncResult {
  startedAt: string;
  finishedAt: string;
  fetchedCount: number;
  upsertedCount: number;
  deactivatedCount: number;
  status: "success" | "failed";
  message: string;
}
