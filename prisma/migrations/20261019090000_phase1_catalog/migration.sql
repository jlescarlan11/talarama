-- Additive metadata; preserve all primary and foreign keys and existing values.
ALTER TABLE "Movie" ADD COLUMN "tmdbId" INTEGER,
  ADD COLUMN "metadataRefreshedAt" TIMESTAMP(3),
  ADD COLUMN "backdropUrl" TEXT,
  ADD COLUMN "credits" JSONB,
  ADD COLUMN "tmdbScore" DOUBLE PRECISION,
  ALTER COLUMN "releasedYear" DROP NOT NULL,
  ALTER COLUMN "duration" DROP NOT NULL;
CREATE UNIQUE INDEX "Movie_tmdbId_key" ON "Movie"("tmdbId");
-- Title/year is descriptive, not identity. Distinct provider IDs may share both.
-- Historical SQL created a constraint; Prisma db push fixtures may use a standalone index.
ALTER TABLE "Movie" DROP CONSTRAINT IF EXISTS "Movie_title_releasedYear_key";
DROP INDEX IF EXISTS "Movie_title_releasedYear_key";
CREATE TABLE "CatalogMappingAudit" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewer" TEXT NOT NULL,
  "mappings" JSONB NOT NULL,
  CONSTRAINT "CatalogMappingAudit_pkey" PRIMARY KEY ("id")
);
