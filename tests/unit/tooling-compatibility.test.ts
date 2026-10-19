// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { it, expect } from 'vitest';
import { ESLint } from 'eslint';
import nextPlugin from '@next/eslint-plugin-next';
import { loadConfigFromFile } from '@prisma/config';

const removeFixture = (root: string) => {
  const target = resolve(root);
  if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('talarama-')) throw new Error('Unsafe fixture cleanup path');
  rmSync(target, { recursive: true, force: true });
};

it.each([false, true])('retains Next link linting with globbed project roots (array: %s)', async (array) => {
  const root = mkdtempSync(join(tmpdir(), 'talarama-eslint-'));
  try {
    const pages = join(root, 'apps', 'site', 'pages');
    mkdirSync(pages, { recursive: true });
    writeFileSync(join(pages, 'about.tsx'), 'export default function About() { return null; }');
    const pattern = join(root, 'apps', '*');
    const lint = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: [{
      files: ['**/*.jsx'], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { '@next/next': nextPlugin }, settings: { next: { rootDir: array ? [pattern] : pattern } },
      rules: { '@next/next/no-html-link-for-pages': 'error' },
    }] });
    const [bad] = await lint.lintText('export default function Page() { return <a href="/about">About</a>; }', { filePath: join(root, 'example.jsx') });
    expect(bad.messages.map(message => message.ruleId)).toContain('@next/next/no-html-link-for-pages');
    const [good] = await lint.lintText('import Link from "next/link"; export default function Page() { return <Link href="/about">About</Link>; }', { filePath: join(root, 'example.jsx') });
    expect(good.errorCount).toBe(0);
  } finally { removeFixture(root); }
});
it('loads and resolves Prisma configuration with the patched merge dependency', async () => {
  const root = mkdtempSync(join(tmpdir(), 'talarama-prisma-config-'));
  try {
    writeFileSync(join(root, 'prisma.config.ts'), 'export default { schema: "./schema.prisma", migrations: { path: "./migrations" } };');
    const loaded = await loadConfigFromFile({ configRoot: root });
    expect(loaded.error).toBeUndefined();
    expect(loaded.config?.schema).toBe(join(root, 'schema.prisma'));
    expect(loaded.config?.migrations?.path).toBe(join(root, 'migrations'));
  } finally { removeFixture(root); }
});
