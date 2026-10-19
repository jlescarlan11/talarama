import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
export default async function setup() {
  const url = process.env.TALARAMA_E2E_DATABASE_URL!;
  const schema = process.env.TALARAMA_E2E_SCHEMA!;
  if (!/^e2e_[a-f0-9]{32}$/.test(schema)) throw new Error('Invalid test schema');
  const db = new PrismaClient({ datasourceUrl: url });
  try {
    await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--skip-generate'], { env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url }, stdio: 'pipe' });
    await db.user.create({ data: { id: 'browser-owner', username: 'browser_member', email: 'browser@example.invalid', image: '/appLogoLight.png', accounts: { create: { id: 'browser-google-link', type: 'oauth', provider: 'google', providerAccountId: 'synthetic-google-sub' } } } });
    await db.movie.create({ data: { id: 'browser-movie', title: 'Phase Zero Film', releasedYear: 2000, duration: 90, description: 'Synthetic test fixture' } });
  } finally { await db.$disconnect(); }
}
