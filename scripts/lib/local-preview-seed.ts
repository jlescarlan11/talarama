import type { PrismaClient } from '@prisma/client';
export async function seedLocalPreview(db:PrismaClient, liveWikidata:boolean) {
  await db.user.create({ data: { id: 'local-preview-member', username: 'synthetic_preview', name: 'Synthetic preview member', email: 'preview@example.invalid', bio: 'Disposable invented member.', profilePublished: true } });
  if (!liveWikidata) {
    await db.movie.create({ data: { id: 'local-preview-film', title: 'Sample: Local Film', releasedYear: 2020, duration: 90, description: 'An invented local movie, not live TMDB data.' } });
    await db.diaryEntry.create({ data: { id: 'local-preview-review', userId: 'local-preview-member', movieId: 'local-preview-film', watchedDate: new Date('2020-02-29'), review: 'Invented sample review for the disposable local preview.', rating: 4, visibility: 'PUBLIC' } });
  }
}
