import { syncNowPlayingMovies } from "../services/sync.js";

const result = await syncNowPlayingMovies();

console.log(JSON.stringify(result, null, 2));

if (result.status !== "success") {
  process.exitCode = 1;
}
