/*
  Warnings:

  - You are about to drop the column `DirectorFirstName` on the `Movie` table. All the data in the column will be lost.
  - You are about to drop the column `DirectorLastName` on the `Movie` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Movie" DROP COLUMN "DirectorFirstName",
DROP COLUMN "DirectorLastName",
ADD COLUMN     "directorFirstName" TEXT,
ADD COLUMN     "directorLastName" TEXT;
