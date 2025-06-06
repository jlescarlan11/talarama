/*
  Warnings:

  - A unique constraint covering the columns `[title,releasedYear]` on the table `Movie` will be added. If there are existing duplicate values, this will fail.

*/
-- First, create a temporary table to store unique movies
CREATE TEMP TABLE temp_unique_movies AS
SELECT DISTINCT ON (title, "releasedYear") *
FROM "Movie"
ORDER BY title, "releasedYear", "createdAt" DESC;

-- Delete all movies
DELETE FROM "Movie";

-- Insert back only unique movies
INSERT INTO "Movie" (
  id,
  title,
  description,
  "releasedYear",
  duration,
  "posterUrl",
  "directorFirstName",
  "directorLastName",
  "createdAt"
)
SELECT 
  id,
  title,
  description,
  "releasedYear",
  duration,
  "posterUrl",
  "directorFirstName",
  "directorLastName",
  "createdAt"
FROM temp_unique_movies;

-- Drop the temporary table
DROP TABLE temp_unique_movies;

-- Add the unique constraint
ALTER TABLE "Movie" ADD CONSTRAINT "Movie_title_releasedYear_key" UNIQUE (title, "releasedYear");
