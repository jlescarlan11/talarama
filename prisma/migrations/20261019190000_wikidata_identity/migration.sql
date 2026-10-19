CREATE TABLE "ExternalMovieIdentity" (
 "provider" TEXT NOT NULL,
 "externalId" TEXT NOT NULL,
 "movieId" TEXT NOT NULL,
 CONSTRAINT "ExternalMovieIdentity_pkey" PRIMARY KEY ("provider", "externalId")
);
CREATE UNIQUE INDEX "ExternalMovieIdentity_provider_movieId_key" ON "ExternalMovieIdentity"("provider", "movieId");
ALTER TABLE "ExternalMovieIdentity" ADD CONSTRAINT "ExternalMovieIdentity_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
