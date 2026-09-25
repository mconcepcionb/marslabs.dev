// Presupuesto de rendimiento del site: mide LCP y CLS en `dist/` con un
// navegador real y falla (exit 1) si se sale del presupuesto. Complementa el
// número de CLS que `scripts/update-stats.mjs` publica en el home: aquel
// informa, este bloquea.
//
//   pnpm run perf          → mide y falla si hay regresión
//   SKIP_PERF=1 pnpm run perf → no mide (escape hatch local/offline)
//
// El navegador se resuelve, por orden: variable PLAYWRIGHT_CHROMIUM_EXECUTABLE,
// paquete `playwright` (CI), o la ruta local que ya usa update-stats.
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const PORT = 4398;
const RUNS = 3;

// Rutas representativas: el home (pesado en JS) y un post (contenido).
const ROUTES = ['/', '/blog/site-que-se-mide/'];

// Presupuestos: holgados sobre los valores locales reales (FCP <150 ms, CLS 0)
// para no ser frágiles, pero que atrapen una regresión clara. Se usa FCP y no
// LCP porque el Chromium headless de Playwright no expone entradas
// `largest-contentful-paint` (sí `paint`); LCP se reporta si existe.
const BUDGETS = {
  fcpMs: 1800,
  cls: 0.05,
};

function log(msg) {
  console.log(`[perf] ${msg}`);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function serveDist() {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://x/').pathname);
      let rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
      let file = path.normalize(path.join(dist, rel));
      if (!file.startsWith(dist)) {
        res.writeHead(403).end();
        return;
      }
      const st = await stat(file);
      if (st.isDirectory()) file = path.join(file, 'index.html');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
  return server;
}

async function resolveExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) {
    return { path: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, how: 'env' };
  }
  try {
    const { chromium } = await import('playwright');
    const p = chromium.executablePath();
    if (p && existsSync(p)) return { path: p, how: 'playwright' };
  } catch {}
  const local = path.join(
    process.env.LOCALAPPDATA ?? '',
    'ms-playwright',
    'chromium-1228',
    'chrome-win64',
    'chrome.exe',
  );
  if (existsSync(local)) return { path: local, how: 'local' };
  return null;
}

async function measure(browser, url) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    localStorage.setItem('mars-theme', 'dark');
    localStorage.setItem('mars-motion', 'on');
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    let cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) cls += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
    window.__perf = () => {
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find((e) => e.name === 'first-contentful-paint');
      const lcp = performance.getEntriesByType('largest-contentful-paint');
      return {
        cls,
        fcp: fcp ? fcp.startTime : 0,
        lcp: lcp.length ? lcp[lcp.length - 1].startTime : 0,
      };
    };
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    const step = Math.max(240, Math.round(h / 30));
    for (let y = 0; y <= h; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => window.__perf());
  await context.close();
  return { fcp: m.fcp, cls: m.cls, lcp: m.lcp };
}

async function main() {
  if (process.env.SKIP_PERF === '1') {
    log('SKIP_PERF=1 — no se mide');
    return;
  }
  if (!existsSync(dist)) {
    console.error('[perf] no hay dist/: ejecuta `pnpm build` antes.');
    process.exit(1);
  }

  const exe = await resolveExecutable();
  if (!exe) {
    console.error(
      '[perf] no se encontró Chromium. Define PLAYWRIGHT_CHROMIUM_EXECUTABLE, ' +
        'instala `playwright` (pnpm exec playwright install chromium) o usa SKIP_PERF=1.',
    );
    process.exit(1);
  }
  log(`navegador: ${exe.how}`);

  const { chromium } = await import('playwright-core');
  const server = await serveDist();
  const browser = await chromium.launch({
    headless: true,
    executablePath: exe.path,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  let failed = false;
  try {
    for (const route of ROUTES) {
      const fcp = [];
      const cls = [];
      let lcp = 0;
      for (let i = 0; i < RUNS; i++) {
        const m = await measure(browser, `http://127.0.0.1:${PORT}${route}`);
        fcp.push(m.fcp);
        cls.push(m.cls);
        if (m.lcp) lcp = m.lcp;
      }
      const fcpMed = median(fcp);
      const clsMed = median(cls);
      const ok = fcpMed <= BUDGETS.fcpMs && clsMed <= BUDGETS.cls;
      if (!ok) failed = true;
      log(
        `${ok ? 'ok  ' : 'FAIL'} ${route}  FCP ${fcpMed.toFixed(0)} ms / ${BUDGETS.fcpMs} ms · ` +
          `CLS ${clsMed.toFixed(4)} / ${BUDGETS.cls}` +
          (lcp ? ` · LCP ${lcp.toFixed(0)} ms` : ''),
      );
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (failed) {
    console.error('[perf] presupuesto incumplido');
    process.exit(1);
  }
  log('presupuesto cumplido');
}

main().catch((err) => {
  console.error(`[perf] ${err.message}`);
  process.exit(1);
});
