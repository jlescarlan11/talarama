/*
  Warnings:

  - Added the required column `watchedDate` to the `DiaryEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DiaryEntry" ADD COLUMN     "watchedDate" TIMESTAMP(3) NOT NULL;
