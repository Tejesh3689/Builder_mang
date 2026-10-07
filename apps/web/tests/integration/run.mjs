// Integration test runner.
//
//   TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/db?schema=itest npm run test:integration
//
// Resets the TEST database with `prisma migrate reset` (i.e. replays the real migration
// history), then runs tests/integration/**/*.test.ts against it. Refuses to run against
// anything that is not localhost, so it can never touch a shared/production database.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  console.error('TEST_DATABASE_URL is not set — refusing to run integration tests.');
  process.exit(1);
}
const host = new URL(url).hostname;
if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
  console.error(`TEST_DATABASE_URL host "${host}" is not local — refusing to reset it.`);
  process.exit(1);
}

const uploadDir = mkdtempSync(path.join(tmpdir(), 'bms-uploads-'));
const env = { ...process.env, DATABASE_URL: url, NODE_ENV: 'test', UPLOAD_DIR: uploadDir, STORAGE_DRIVER: 'local' };
const run = (cmd, args) => spawnSync(cmd, args, { stdio: 'inherit', env, shell: process.platform === 'win32' });

let status = run('npx', ['prisma', 'migrate', 'reset', '--force', '--skip-seed', '--skip-generate']).status;
if (status === 0) {
  status = run('npx', [
    'tsx', '--test', '--experimental-test-module-mocks', '--test-concurrency=1',
    '"tests/integration/**/*.test.ts"',
  ]).status;
}
rmSync(uploadDir, { recursive: true, force: true });
process.exit(status ?? 1);
