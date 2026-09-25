// Build con auto-medición de stats para el site Mars Labs.
//
//   npm run build  →  este script
//
// Corre `astro build`, mide el resultado real y reescribe las métricas del home
// (`src/content/metrics/*.md`) y los números del proyecto `marslabs-dev`.
// Los valores que muestra el site son la foto de la ÚLTIMA build: el script
// escribe las métricas tras generar el HTML, así que los nuevos números quedan
// reflejados en la siguiente build.
//
// Qué se mide:
//   - páginas generadas y tiempo de build (parseados del output de Astro)
//   - media de bytes de HTML por página (de `dist/`)
//   - CLS en carga real (si hay Chromium disponible; con `SKIP_CLS=1` se omite)
//
// En CI/Docker no hay Chromium: el CLS se conserva del último valor local.
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const astroCli = path.join(root, 'node_modules', 'astro', 'bin', 'astro.mjs');
const chromiumPath = path.join(
  process.env.LOCALAPPDATA ?? '',
  'ms-playwright',
  'chromium-1228',
  'chrome-win64',
  'chrome.exe',
);
const CLS_PORT = 4399;

const metricsDir = path.join(root, 'src', 'content', 'metrics');
const projectFile = path.join(root, 'src', 'content', 'projects', 'marslabs-dev.md');

function log(msg) {
  console.log(`[stats] ${msg}`);
}

const esNum = (n, d) =>
  new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n);

function walkHtml(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkHtml(p));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function writeMax(file, value) {
  const p = path.join(metricsDir, file);
  const src = readFileSync(p, 'utf8');
  writeFileSync(p, src.replace(/^(max: ).*$/m, `$1${value}`));
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
  await new Promise((r) => server.listen(CLS_PORT, '127.0.0.1', r));
  return server;
}

async function measureCls() {
  const { chromium } = await import('playwright-core');
  if (!existsSync(chromiumPath)) throw new Error('chromium no disponible');
  const server = await serveDist();
  try {
    const browser = await chromium.launch({
      headless: true,
      executablePath: chromiumPath,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => {
      localStorage.setItem('mars-theme', 'dark');
      localStorage.setItem('mars-motion', 'on');
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      let v = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) v += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
      window.__cls = () => v;
    });
    await page.goto(`http://127.0.0.1:${CLS_PORT}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1800);
    await page.evaluate(async () => {
      const h = document.body.scrollHeight;
      const step = Math.max(240, Math.round(h / 30));
      for (let y = 0; y <= h; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);
    const cls = await page.evaluate(() => window.__cls());
    await browser.close();
    return cls;
  } finally {
    server.close();
  }
}

function updateProjectBody({ pages, buildTime, meanKB, cls }) {
  let src = readFileSync(projectFile, 'utf8');
  src = src.replace(/(\*\*)\d+( páginas\*\*)/, `$1${pages}$2`);
  src = src.replace(/(generadas en \*\*)[\d.,]+( s\*\*)/, `$1${esNum(buildTime, 2)}$2`);
  src = src.replace(/(\*\*~)[\d.,]+( KB de HTML por página\*\*)/, `$1${esNum(meanKB, 1)}$2`);
  if (cls !== null) src = src.replace(/(\*\*CLS de )[\d.,]+(\*\*)/, `$1${esNum(cls, 3)}$2`);
  writeFileSync(projectFile, src);
}

async function main() {
  log('construyendo…');
  const build = spawnSync(process.execPath, [astroCli, 'build'], { cwd: root, encoding: 'utf8' });
  const output = `${build.stdout ?? ''}\n${build.stderr ?? ''}`;
  if (build.status !== 0) {
    console.error(output);
    process.exit(build.status ?? 1);
  }

  const clean = output.replace(/\u001b\[[0-9;]*m/g, '');
  // Astro imprime segundos cuando el build tarda >= 1 s y milisegundos cuando
  // baja de ahí ("29 page(s) built in 949ms"); ambos deben normalizarse a s.
  const parsed = clean.match(/(\d+) page\(s\) built in ([\d.]+)(ms|s)/);
  if (!parsed) {
    console.error('[stats] no se pudo parsear el resultado del build:\n' + clean);
    process.exit(1);
  }
  const pages = Number(parsed[1]);
  const seconds = parsed[3] === 'ms' ? Number(parsed[2]) / 1000 : Number(parsed[2]);
  const buildTime = Number(seconds.toFixed(2));

  const htmls = walkHtml(dist);
  const total = htmls.reduce((sum, f) => sum + statSync(f).size, 0);
  const meanKB = Math.round((total / htmls.length) / 100) / 10;

  let cls = null;
  if (process.env.SKIP_CLS !== '1') {
    try {
      cls = await measureCls();
      log(`CLS = ${cls.toFixed(4)}`);
    } catch (err) {
      log(`CLS no medido (${err.message}) — se conserva el valor actual`);
    }
  }

  writeMax('paginas-build.md', pages);
  writeMax('tiempo-build.md', buildTime);
  writeMax('peso-pagina.md', meanKB);
  if (cls !== null) writeMax('cls.md', cls.toFixed(3));
  updateProjectBody({ pages, buildTime, meanKB, cls });

  const fmt = (n, d) => esNum(n, d);
  log(
    `stats: ${pages} páginas · ${fmt(buildTime, 2)} s · ${fmt(meanKB, 1)} KB media` +
      (cls !== null ? ` · CLS ${fmt(cls, 3)}` : ''),
  );
  log('stats actualizadas');
}

main().catch((err) => {
  console.error(`[stats] ${err.message}`);
  process.exit(1);
});