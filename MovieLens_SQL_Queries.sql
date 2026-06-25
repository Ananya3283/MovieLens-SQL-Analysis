CREATE DATABASE movielens;
USE movielens; 
CREATE TABLE movies (
    movieId INT,
    title VARCHAR(255),
    genres VARCHAR(255)
);
CREATE TABLE ratings (
    userId INT,
    movieId INT,
    rating DECIMAL(2,1),
    timestamp BIGINT
);
DROP TABLE IF EXISTS ratings;
CREATE TABLE ratings (
    userId INT,
    movieId INT,
    rating DECIMAL(2,1),
    timestamp BIGINT
);
SHOW TABLES;
DESCRIBE ratings;
TRUNCATE TABLE ratings;
DESCRIBE ratings_sample;
SELECT COUNT(*) FROM ratings_sample;
SELECT COUNT(*) FROM ratings;
DROP TABLE ratings_sample;
SELECT * FROM ratings_sample LIMIT 10;
SELECT COUNT(*) AS total_movies
FROM movies;
SELECT ROUND(AVG(rating),2) AS average_rating
FROM ratings_sample;
SELECT
    rating,
    COUNT(*) AS total_count
FROM ratings_sample
GROUP BY rating
ORDER BY rating;
SELECT
    m.title,
    ROUND(AVG(r.rating),2) AS avg_rating,
    COUNT(*) AS total_ratings
FROM ratings_sample r
JOIN movies m
ON r.movieId = m.movieId
GROUP BY m.title
HAVING COUNT(*) >= 5
ORDER BY avg_rating DESC
LIMIT 10;
SELECT
    m.title,
    COUNT(*) AS total_ratings
FROM ratings_sample r
JOIN movies m
ON r.movieId = m.movieId
GROUP BY m.title
ORDER BY total_ratings DESC
LIMIT 10;
SELECT
    m.genres,
    ROUND(AVG(r.rating),2) AS avg_rating,
    COUNT(*) AS rating_count
FROM ratings_sample r
JOIN movies m
ON r.movieId = m.movieId
GROUP BY m.genres
HAVING COUNT(*) >= 5
ORDER BY avg_rating DESC
LIMIT 10;
SELECT
    SUBSTRING_INDEX(
        SUBSTRING_INDEX(title,'(', -1),
        ')',
        1
    ) AS release_year,
    COUNT(*) AS movie_count
FROM movies
GROUP BY release_year
ORDER BY release_year;
SELECT
    m.title,
    COUNT(*) AS total_ratings
FROM ratings_sample r
JOIN movies m
ON r.movieId = m.movieId
GROUP BY m.title
ORDER BY total_ratings DESC
LIMIT 10;
SELECT
    m.title,
    ROUND(AVG(r.rating),2) AS avg_rating,
    COUNT(*) AS total_ratings
FROM ratings_sample r
JOIN movies m
ON r.movieId = m.movieId
GROUP BY m.title
HAVING COUNT(*) >= 5
ORDER BY avg_rating DESC
LIMIT 10;
SELECT
    m.genres,
    ROUND(AVG(r.rating),2) AS avg_rating,
    COUNT(*) AS rating_count
FROM ratings_sample r
JOIN movies m
ON r.movieId = m.movieId
GROUP BY m.genres
HAVING COUNT(*) >= 5
ORDER BY avg_rating DESC
LIMIT 10;