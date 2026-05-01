import path from 'node:path';
import { finalizeCoverage, loadNextcovConfig } from 'nextcov/playwright';

export default async function globalTeardown() {
  const config = await loadNextcovConfig(path.join(process.cwd(), 'playwright.config.ts'));
  await finalizeCoverage(config);
}
