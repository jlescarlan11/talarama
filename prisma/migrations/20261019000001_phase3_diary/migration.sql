-- Additive only: originals, IDs and physical WatchedList remain intact.
CREATE TYPE "DiaryVisibility" AS ENUM ('PRIVATE', 'PUBLIC');
ALTER TABLE "User" ADD COLUMN "timeZone" TEXT;
ALTER TABLE "DiaryEntry" ALTER COLUMN "rating" DROP NOT NULL,
 ALTER COLUMN "review" SET DEFAULT '',
 ADD COLUMN "visibility" "DiaryVisibility" NOT NULL DEFAULT 'PRIVATE',
 ADD COLUMN "isRewatch" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "containsSpoilers" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "clientRequestId" TEXT;
CREATE UNIQUE INDEX "DiaryEntry_userId_clientRequestId_key" ON "DiaryEntry"("userId", "clientRequestId");
CREATE INDEX "DiaryEntry_userId_watchedDate_id_idx" ON "DiaryEntry"("userId", "watchedDate", "id");
-- No timestamp conversion here: use the preview and explicit reviewed manifest.
