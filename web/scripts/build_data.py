"""Builds web/src/data/movielens.json from movies.csv and ratings_sample.csv (the tables the SQL queries use).

Run from the repo root:  python web/scripts/build_data.py
Per movie: number of ratings, average, a histogram of half-star ratings, genres and release year.
"""
import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
movies = pd.read_csv(ROOT / "movies.csv")
ratings = pd.read_csv(ROOT / "ratings_sample.csv")

stats = ratings.groupby("movieId")["rating"].agg(n="count", avg="mean").reset_index()
hist = ratings.assign(bin=(ratings["rating"] * 2).astype(int) - 1).pivot_table(index="movieId", columns="bin", values="userId", aggfunc="count", fill_value=0)
hist = hist.reindex(columns=range(10), fill_value=0)
m = movies.merge(stats, on="movieId")
m["year"] = m["title"].str.extract(r"\((\d{4})\)\s*$")[0].astype("float")
genres = sorted({g for gs in m["genres"].str.split("|") for g in gs if g != "(no genres listed)"})
gi = {g: i for i, g in enumerate(genres)}

rows = []
for t in m.itertuples():
    rows.append([
        t.title, None if pd.isna(t.year) else int(t.year), int(t.n), round(float(t.avg), 4),
        [gi[g] for g in t.genres.split("|") if g in gi], [int(x) for x in hist.loc[t.movieId].tolist()],
    ])

out = {"genres": genres, "ratings": int(len(ratings)), "users": int(ratings["userId"].nunique()),
       "fields": ["title", "year", "ratings", "average", "genres", "halfStarHistogram(0.5..5)"], "rows": rows}
dest = ROOT / "web" / "src" / "data" / "movielens.json"
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
print(f"{len(ratings):,} ratings, {out['users']:,} users, {len(m):,} rated movies -> {dest.relative_to(ROOT)} ({dest.stat().st_size/1024:.0f} KB)")
top = m.sort_values("n", ascending=False).head(3)[["title", "n"]].values.tolist()
best = m[m.n >= 5].sort_values("avg", ascending=False).head(3)[["title", "avg", "n"]].values.tolist()
print("most rated", top); print("top rated (min 5)", [(t, round(a, 2), n) for t, a, n in best])
