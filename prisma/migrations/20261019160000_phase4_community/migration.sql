-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('MEMBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ModerationState" AS ENUM ('VISIBLE', 'HIDDEN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "profilePublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
ADD COLUMN     "showFavorites" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "DiaryEntry" ADD COLUMN     "moderationState" "ModerationState" NOT NULL DEFAULT 'VISIBLE';

-- CreateTable
CREATE TABLE "EntryReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "EntryReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAudit" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsernameMappingAudit" (
    "id" TEXT NOT NULL,
    "reviewer" TEXT NOT NULL,
    "mappings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsernameMappingAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MutationBucket" (
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MutationBucket_pkey" PRIMARY KEY ("userId","kind","windowStart")
);

-- CreateIndex
CREATE INDEX "EntryReport_createdAt_id_idx" ON "EntryReport"("createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "EntryReport_reporterId_entryId_key" ON "EntryReport"("reporterId", "entryId");

-- CreateIndex
CREATE INDEX "MutationBucket_expiresAt_idx" ON "MutationBucket"("expiresAt");

-- CreateIndex
CREATE INDEX "DiaryEntry_createdAt_id_idx" ON "DiaryEntry"("createdAt", "id");

-- AddForeignKey
ALTER TABLE "EntryReport" ADD CONSTRAINT "EntryReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryReport" ADD CONSTRAINT "EntryReport_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "DiaryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
