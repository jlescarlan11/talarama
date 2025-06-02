/*
  Warnings:

  - The primary key for the `Account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `diary_entry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `genre` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `liked_by` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `movie` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `movie_genres` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `watched_list` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "diary_entry" DROP CONSTRAINT "diary_entry_movieId_fkey";

-- DropForeignKey
ALTER TABLE "diary_entry" DROP CONSTRAINT "diary_entry_userId_fkey";

-- DropForeignKey
ALTER TABLE "liked_by" DROP CONSTRAINT "liked_by_movieId_fkey";

-- DropForeignKey
ALTER TABLE "liked_by" DROP CONSTRAINT "liked_by_userId_fkey";

-- DropForeignKey
ALTER TABLE "movie_genres" DROP CONSTRAINT "movie_genres_genreId_fkey";

-- DropForeignKey
ALTER TABLE "movie_genres" DROP CONSTRAINT "movie_genres_movieId_fkey";

-- DropForeignKey
ALTER TABLE "watched_list" DROP CONSTRAINT "watched_list_movieId_fkey";

-- DropForeignKey
ALTER TABLE "watched_list" DROP CONSTRAINT "watched_list_userId_fkey";

-- AlterTable
ALTER TABLE "Account" DROP CONSTRAINT "Account_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Account_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Account_id_seq";

-- DropTable
DROP TABLE "diary_entry";

-- DropTable
DROP TABLE "genre";

-- DropTable
DROP TABLE "liked_by";

-- DropTable
DROP TABLE "movie";

-- DropTable
DROP TABLE "movie_genres";

-- DropTable
DROP TABLE "watched_list";

-- CreateTable
CREATE TABLE "Movie" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "releasedYear" INTEGER NOT NULL,
    "duration" TEXT NOT NULL,
    "posterUrl" TEXT,
    "DirectorFirstName" TEXT,
    "DirectorLastName" TEXT,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "genreName" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchedList" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,

    CONSTRAINT "WatchedList_pkey" PRIMARY KEY ("movieId","userId")
);

-- CreateTable
CREATE TABLE "LikedBy" (
    "likedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,

    CONSTRAINT "LikedBy_pkey" PRIMARY KEY ("movieId","userId")
);

-- CreateTable
CREATE TABLE "MovieCategorizesAs" (
    "movieId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "MovieCategorizesAs_pkey" PRIMARY KEY ("genreId","movieId")
);

-- CreateTable
CREATE TABLE "DiaryEntry" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,

    CONSTRAINT "DiaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Genre_genreName_key" ON "Genre"("genreName");

-- AddForeignKey
ALTER TABLE "WatchedList" ADD CONSTRAINT "WatchedList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchedList" ADD CONSTRAINT "WatchedList_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikedBy" ADD CONSTRAINT "LikedBy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikedBy" ADD CONSTRAINT "LikedBy_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieCategorizesAs" ADD CONSTRAINT "MovieCategorizesAs_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieCategorizesAs" ADD CONSTRAINT "MovieCategorizesAs_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryEntry" ADD CONSTRAINT "DiaryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryEntry" ADD CONSTRAINT "DiaryEntry_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
