import NumberFlow from "@number-flow/react"
import { AnimatePresence, motion } from "motion/react"
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"
import { useMemo } from "react"
import { OrderedColumns, Panel, RankBars } from "@/components/charts"
import { Figures } from "@/components/figures"
import { ALL, FilterBar, type Field } from "@/components/filter-bar"
import { PageHeader } from "@/components/page-header"
import { Segmented } from "@/components/segmented"
import { DECADES, MIN_OPTIONS, MOVIES, STARS, applyFilters, avgRating, histogram, insights, options, ratingCount, tidy, type Filters } from "@/data/movielens"

// Every setting lives in the URL, so a filtered view can be shared as a link
const params = {
  genre: parseAsString.withDefault(ALL),
  decade: parseAsString.withDefault(ALL),
  min: parseAsStringLiteral(MIN_OPTIONS).withDefault("20"),
}

const FIELDS: Field[] = [
  { key: "genre", label: "Genre", all: "All genres", options: options.genre },
  { key: "decade", label: "Release decade", all: "All decades", options: options.decade },
]

const short = (t: string) => (t.length > 30 ? `${t.slice(0, 28)}…` : t)

export default function App() {
  const [q, setQ] = useQueryStates(params)
  const filters: Filters = { genre: q.genre, decade: q.decade }
  const rows = useMemo(() => applyFilters(MOVIES, filters), [q.genre, q.decade]) // eslint-disable-line react-hooks/exhaustive-deps
  const min = Number(q.min)

  const mostRated = [...rows].sort((a, b) => b.n - a.n).slice(0, 10).map((m) => ({ key: short(tidy(m.title)), value: m.n, detail: m.title }))
  const topRated = rows
    .filter((m) => m.n >= min)
    .sort((a, b) => b.avg - a.avg || b.n - a.n)
    .slice(0, 10)
    .map((m) => ({ key: short(tidy(m.title)), value: m.avg, detail: `${m.n} ratings, ${m.title}` }))
  const genres = options.genre
    .map((g) => {
      const inGenre = rows.filter((m) => m.genres.includes(g))
      return { key: g, value: avgRating(inGenre), detail: `${ratingCount(inGenre).toLocaleString("en-US")} ratings`, n: ratingCount(inGenre) }
    })
    .filter((d) => d.n >= min * 5)
  const hist = histogram(rows)
  const avg = avgRating(rows)

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-8">
      <PageHeader title="MovieLens ratings" dataset="MovieLens sample, 100,000 ratings of 8,466 movies." repo="https://github.com/Ananya3283/MovieLens-SQL-Analysis" linkText="SQL queries on GitHub" />

      <div className="sticky top-0 z-20 -mx-4 mt-6 border-b bg-background/90 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <FilterBar fields={FIELDS} value={filters} onChange={(k, v) => setQ({ [k]: v === ALL ? null : v })} />
          <div className="grid gap-1 text-sm text-muted-foreground">
            Minimum ratings for "top rated"
            <Segmented id="min" label="Minimum number of ratings" value={q.min} onChange={(v) => setQ({ min: v === "20" ? null : v })} options={MIN_OPTIONS.map((m) => ({ value: m, label: `${m}+` }))} />
          </div>
        </div>
      </div>

      <main className="mt-10">
        {rows.length === 0 ? (
          <p className="py-24 text-center text-muted-foreground">No movies match these filters. Clear one to see results.</p>
        ) : (
          <div className="space-y-12">
            <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div>
                <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
                  <NumberFlow value={ratingCount(rows)} /> ratings.{" "}
                  <span className="text-leaver">
                    <NumberFlow value={avg ?? 0} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} /> stars on average.
                  </span>
                </h1>
                <h2 className="mt-8 text-base font-semibold">What stands out</h2>
                <ul className="mt-2 space-y-2.5">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {insights(rows, min).map((t) => (
                      <motion.li
                        key={t}
                        layout
                        initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, filter: "blur(2px)", transition: { duration: 0.15 } }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="border-l-2 border-leaver pl-3 leading-snug"
                      >
                        {t}
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
              <Panel title="How people rate" note="Number of ratings at each half-star step.">
                <OrderedColumns data={STARS.map((s, i) => ({ key: s, value: hist[i] }))} format="int" height={300} />
              </Panel>
            </section>

            <Figures
              items={[
                { label: "Ratings", value: ratingCount(rows), format: "int" },
                { label: "Movies rated", value: rows.length, format: "int" },
                { label: "Average rating", value: avg, format: "dec2", tone: "left" },
                { label: `Movies with ${min}+ ratings`, value: rows.filter((m) => m.n >= min).length, format: "int" },
                { label: "Rated 4 stars or more", value: hist.slice(7).reduce((a, b) => a + b, 0) / hist.reduce((a, b) => a + b, 0), format: "pct" },
                { label: "Genres", value: new Set(rows.flatMap((m) => m.genres)).size, format: "int" },
              ]}
            />

            <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
              <Panel title="Most rated movies" note="Hover a bar for the full title.">
                <RankBars data={mostRated} format="int" labelWidth={230} />
              </Panel>
              <Panel title={`Top rated movies (${min}+ ratings)`} note="Average rating; hover for the number of ratings.">
                {topRated.length ? <RankBars data={topRated} format="dec2" labelWidth={230} color="var(--kept)" /> : <p className="py-8 text-sm text-muted-foreground">No movie here has {min} ratings yet. Pick a lower minimum.</p>}
              </Panel>
              <Panel title="Average rating by genre" note={`Genres with at least ${(min * 5).toLocaleString("en-US")} ratings.`}>
                <RankBars data={genres} format="dec2" labelWidth={110} color="var(--kept)" />
              </Panel>
              <Panel title="Ratings by release decade" note="Number of ratings, by the decade each movie came out.">
                <OrderedColumns data={DECADES.map((d) => ({ key: d.replace("Before ", "<"), value: ratingCount(rows.filter((m) => m.decade === d)) }))} format="int" labels={false} />
              </Panel>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
