const { execSync } = require('child_process');
try {
  execSync('PORT=3000 npx playwright test __tests__/e2e/admin.spec.ts', { stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}
