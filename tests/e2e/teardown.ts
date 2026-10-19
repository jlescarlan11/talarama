import { PrismaClient } from '@prisma/client';
export default async function teardown() {
  const schema = process.env.TALARAMA_E2E_SCHEMA!;
  if (!/^e2e_[a-f0-9]{32}$/.test(schema)) throw new Error('Invalid test schema');
  const db = new PrismaClient({ datasourceUrl: process.env.TALARAMA_E2E_DATABASE_URL });
  try { await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); }
  finally { await db.$disconnect(); }
}
