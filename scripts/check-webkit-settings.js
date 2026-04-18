const { webkit } = require('@playwright/test');

(async () => {
  console.log('launching-browser');
  const browser = await webkit.launch({ headless: true });
  const page = await browser.newPage();

  console.log('navigating-login');
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  console.log(`login-url=${page.url()}`);

  const accept = page.getByRole('button', { name: /^Accept$/i });
  if (await accept.isVisible().catch(() => false)) {
    console.log('accepting-cookies');
    await accept.click();
  }

  console.log('filling-credentials');
  await page.getByRole('textbox', { name: /^Email$/i }).fill('alice@example.com');
  await page.getByRole('textbox', { name: /^Password$/i }).fill('Test1234!');
  console.log('submitting-login');
  await page.getByRole('button', { name: /^Sign In$/i }).click();
  await page.waitForFunction(() => !window.location.pathname.startsWith('/login'), undefined, {
    timeout: 10000,
  });

  console.log(`after-login=${page.url()}`);

  console.log('navigating-privacy');
  await page.goto('http://localhost:3000/settings/privacy', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.location.pathname.startsWith('/settings/privacy'), undefined, {
    timeout: 10000,
  });

  const headingVisible = await page
    .getByRole('heading', { name: /privacy settings/i, level: 1 })
    .isVisible();

  console.log(`privacy-heading-visible=${headingVisible}`);

  await browser.close();
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
