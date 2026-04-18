import path from 'node:path';
import { initCoverage, loadNextcovConfig } from 'nextcov/playwright';

export default async function globalSetup() {
  const config = await loadNextcovConfig(path.join(process.cwd(), 'playwright.config.ts'));
  await initCoverage(config);
}