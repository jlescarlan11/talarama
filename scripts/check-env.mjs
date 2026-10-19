// Do not display configuration values: only missing variable names.
const required = ['DATABASE_URL', 'DIRECT_URL', 'NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
try { process.loadEnvFile('.env'); } catch { /* Environment may be supplied by the host. */ }
const missing = required.filter(name => !process.env[name] || /REPLACE_|DEV_USER|DEV_PASSWORD/.test(process.env[name]));
if (missing.length) {
  console.error(`Development configuration missing: ${missing.join(', ')}`);
  console.error('See .env.example and README.md. Never paste credentials into chat or commit them.');
  process.exitCode = 1;
} else { console.log('Required development configuration is present (connectivity and OAuth still require a smoke check).'); }
