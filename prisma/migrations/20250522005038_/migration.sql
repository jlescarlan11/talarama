/*
  Warnings:

  - A unique constraint covering the columns `[genreName]` on the table `genre` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "genre_genreName_key" ON "genre"("genreName");
