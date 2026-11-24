import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page,
} from '@playwright/test';

/**
 * Smoke-Test gegen die gebaute App (`pnpm build` vorher). Prüft Start, Takt, Pause,
 * Zeitraffer, Tastatur, Notrufannahme und die Wiederherstellung nach einem Sim-Host-Absturz.
 */
let app: ElectronApplication;
let page: Page;
let userData: string;

const readClock = async () => (await page.getByTestId('sim-time').textContent()) ?? '';
const toSeconds = (hms: string) => {
  const [h, m, s] = hms.split(':').map(Number);
  return (h ?? 0) * 3600 + (m ?? 0) * 60 + (s ?? 0);
};

test.beforeAll(async () => {
  userData = mkdtempSync(join(tmpdir(), 'ls112-e2e-'));
  const started = Date.now();
  app = await electron.launch({
    args: [join(import.meta.dirname, '..', 'apps', 'desktop')],
    env: {
      ...process.env,
      LS112_E2E: '1',
      LS112_USER_DATA: userData,
      LS112_SEED: '112',
      LS112_CALL_RATE: '120',
    },
  });
  page = await app.firstWindow();
  await expect(page.getByTestId('sim-time')).toBeVisible();
  // Anforderung: Spielstart unter 5 Sekunden.
  expect(Date.now() - started).toBeLessThan(5000);
});

test.afterAll(async () => {
  await app.close();
  rmSync(userData, { recursive: true, force: true });
});

test('zeigt Titel und läuft im 1×-Takt', async () => {
  await expect(page).toHaveTitle('Leitstelle 112');
  const a = toSeconds(await readClock());
  await page.waitForTimeout(2100);
  const b = toSeconds(await readClock());
  expect(b - a).toBeGreaterThanOrEqual(1);
  expect(b - a).toBeLessThanOrEqual(4);
});

test('Pause per Leertaste hält die Zeit an', async () => {
  await page.keyboard.press('Space');
  await expect(page.getByTestId('paused-badge')).toBeVisible();
  const a = await readClock();
  await page.waitForTimeout(1500);
  expect(await readClock()).toBe(a);
  await page.keyboard.press('Space');
  await expect(page.getByTestId('paused-badge')).toBeHidden();
});

test('Zeitraffer 10× beschleunigt die Spielzeit', async () => {
  await page.getByTestId('btn-speed-10').click();
  const a = toSeconds(await readClock());
  await page.waitForTimeout(2000);
  const b = toSeconds(await readClock());
  expect(b - a).toBeGreaterThanOrEqual(12);
});

test('F2 nimmt den ältesten Notruf an', async () => {
  await page.keyboard.press('4'); // 10×
  await expect(page.getByTestId('call-row').first()).toBeVisible({ timeout: 30_000 });
  await page.keyboard.press('Space'); // Pause, damit kein neuer Anruf dazwischenkommt
  const before = Number(await page.getByTestId('calls-count').textContent());
  await page.keyboard.press('F2');
  await page.keyboard.press('Space');
  await expect(page.getByTestId('event-log')).toContainText('angenommen');
  expect(before).toBeGreaterThan(0);
});

test('stellt die Simulation nach einem Absturz wieder her', async () => {
  await page.evaluate(() => {
    window.ls112?.e2eCrashSimHost();
  });
  await expect
    .poll(async () => page.evaluate(async () => (await window.ls112?.appInfo())?.simHostRestarts), {
      timeout: 15_000,
    })
    .toBe(1);
  // Neue Simulation läuft wieder (ohne Autosave beginnt sie beim Schichtstart).
  await expect(page.getByTestId('sim-time')).toBeVisible();
  // Erst den ersten Zustand der neuen Simulation abwarten, dann Fortschritt messen.
  await expect(page.getByText('Simulation verbunden')).toBeVisible();
  await page.waitForTimeout(700);
  const a = toSeconds(await readClock());
  await page.waitForTimeout(1500);
  expect(toSeconds(await readClock())).toBeGreaterThan(a);
  const crashes = readdirSync(join(userData, 'crashes')).filter((f) =>
    f.endsWith('-sim-host.json'),
  );
  expect(crashes.length).toBe(1);
});
