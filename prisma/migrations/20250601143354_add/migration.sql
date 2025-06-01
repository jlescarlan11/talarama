/*
  Warnings:

  - You are about to alter the column `genreName` on the `genre` table. The data in that column could be lost. The data in that column will be cast from `VarChar(55)` to `VarChar(50)`.
  - You are about to drop the column `directorFirstName` on the `movie` table. All the data in the column will be lost.
  - You are about to drop the column `directorLastName` on the `movie` table. All the data in the column will be lost.
  - You are about to alter the column `title` on the `movie` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `posterUrl` on the `movie` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to drop the `DiaryEntry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DiaryEntry" DROP CONSTRAINT "DiaryEntry_movieId_fkey";

-- DropForeignKey
ALTER TABLE "DiaryEntry" DROP CONSTRAINT "DiaryEntry_userId_fkey";

-- AlterTable
ALTER TABLE "genre" ALTER COLUMN "genreName" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "movie" DROP COLUMN "directorFirstName",
DROP COLUMN "directorLastName",
ALTER COLUMN "title" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "duration" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "posterUrl" SET DATA TYPE VARCHAR(50);

-- DropTable
DROP TABLE "DiaryEntry";

-- CreateTable
CREATE TABLE "watched_list" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,

    CONSTRAINT "watched_list_pkey" PRIMARY KEY ("userId","movieId")
);

-- CreateTable
CREATE TABLE "liked_by" (
    "likedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,

    CONSTRAINT "liked_by_pkey" PRIMARY KEY ("userId","movieId")
);

-- CreateTable
CREATE TABLE "diary_entry" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,

    CONSTRAINT "diary_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "diary_entry_userId_movieId_key" ON "diary_entry"("userId", "movieId");

-- AddForeignKey
ALTER TABLE "watched_list" ADD CONSTRAINT "watched_list_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watched_list" ADD CONSTRAINT "watched_list_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liked_by" ADD CONSTRAINT "liked_by_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liked_by" ADD CONSTRAINT "liked_by_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diary_entry" ADD CONSTRAINT "diary_entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diary_entry" ADD CONSTRAINT "diary_entry_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
