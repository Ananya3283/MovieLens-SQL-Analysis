// Per-movie rating stats from movies.csv + ratings_sample.csv (built by web/scripts/build_data.py).
import raw from "./movielens.json"
import { ALL } from "@/components/filter-bar"

type Raw = { genres: string[]; ratings: number; users: number; rows: [string, number | null, number, number, number[], number[]][] }
const data = raw as unknown as Raw

export type Movie = { title: string; year: number | null; decade: string; n: number; avg: number; genres: string[]; hist: number[] }

const decadeOf = (y: number | null) => (y == null ? "Unknown" : y < 1950 ? "Before 1950" : `${Math.floor(y / 10) * 10}s`)

export const MOVIES: Movie[] = data.rows.map(([title, year, n, avg, g, hist]) => ({
  title,
  year,
  decade: decadeOf(year),
  n,
  avg,
  genres: g.map((i) => data.genres[i]),
  hist,
}))
export const TOTAL_USERS = data.users
export const DECADES = ["Before 1950", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s"]
export const STARS = ["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"]
export const MIN_OPTIONS = ["5", "20", "50", "100"] as const

// ---------- filters (the slicers)
export type Filters = { genre: string; decade: string }
export const options = { genre: data.genres, decade: DECADES }
export const applyFilters = (rows: Movie[], f: Filters) =>
  rows.filter((m) => (f.genre === ALL || m.genres.includes(f.genre)) && (f.decade === ALL || m.decade === f.decade))

// ---------- measures
export const ratingCount = (rows: Movie[]) => rows.reduce((t, m) => t + m.n, 0)
/** Average over every rating (weighted by count), as the SQL AVG over the joined table does. */
export const avgRating = (rows: Movie[]) => {
  const n = ratingCount(rows)
  return n ? rows.reduce((t, m) => t + m.avg * m.n, 0) / n : null
}
export const histogram = (rows: Movie[]) => STARS.map((_, i) => rows.reduce((t, m) => t + m.hist[i], 0))

/** Titles end with "(1994)"; "Shawshank Redemption, The" reads better as "The Shawshank Redemption". */
export const tidy = (title: string) => {
  const t = title.replace(/\s*\(\d{4}\)\s*$/, "")
  const m = t.match(/^(.*), (The|A|An)$/)
  return m ? `${m[2]} ${m[1]}` : t
}

/** Plain-language findings that update with the filters. */
export function insights(rows: Movie[], min: number): string[] {
  if (!rows.length) return []
  const out: string[] = []
  const most = [...rows].sort((a, b) => b.n - a.n)[0]
  out.push(`${tidy(most.title)} is the most rated, with ${most.n.toLocaleString("en-US")} ratings.`)
  const best = rows.filter((m) => m.n >= min).sort((a, b) => b.avg - a.avg)[0]
  if (best) out.push(`${tidy(best.title)} rates highest among movies with ${min}+ ratings: ${best.avg.toFixed(2)} stars.`)
  const h = histogram(rows)
  const total = h.reduce((a, b) => a + b, 0)
  const high = h.slice(7).reduce((a, b) => a + b, 0)
  out.push(`${Math.round((high / total) * 100)}% of ratings are 4 stars or more.`)
  const top = STARS[h.indexOf(Math.max(...h))]
  out.push(`${top} stars is the most common rating.`)
  return out
}
