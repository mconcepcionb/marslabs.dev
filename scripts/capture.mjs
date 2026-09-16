// Captura de pantallas de Mars Labs — un solo comando: `pnpm capture`
//   Sirve dist/ con un servidor estático propio (sin daemon de astro),
//   abre Chromium una sola vez y guarda la matriz completa
//   (theme × motion × viewport) en screenshots/.
//   Flags opcionales para una pasada rápida:
//     pnpm capture --theme light --viewport mobile --motion on
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, stat, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const PORT = Number(process.env.PORT) || 4399;
const base = `http://127.0.0.1:${PORT}/`;
const astroCli = path.join(root, 'node_modules', 'astro', 'bin', 'astro.mjs');
const outDir = path.join(root, 'screenshots');

const defaultChromium = path.join(
  process.env.LOCALAPPDATA ?? '',
  'ms-playwright',
  'chromium-1228',
  'chrome-win64',
  'chrome.exe',
);
const executablePath = process.env.CHROMIUM_PATH || defaultChromium;

const flags = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a) => a.match(/^--([\w-]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);

const viewports = flags.viewport ? [flags.viewport] : ['desktop', 'mobile'];
const themes = flags.theme ? [flags.theme] : ['dark', 'light'];
const motions = flags.motion ? [flags.motion] : ['on', 'off'];

const viewportSize = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain',
};

function log(msg) {
  console.log(`[capture] ${msg}`);
}

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url ?? '/', base).pathname);
      let rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
      let file = path.normalize(path.join(dist, rel));
      if (!file.startsWith(dist)) {
        res.writeHead(403).end();
        return;
      }
      const st = await stat(file);
      if (st.isDirectory()) file = path.join(file, 'index.html');
      const data = await readFile(file);
      res.writeHead(200, {
        'content-type': MIME[path.extname(file)] || 'application/octet-stream',
      });
      res.end(data);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function ensureBuild() {
  if (existsSync(path.join(dist, 'index.html'))) return;
  log('dist/ no encontrado — construyendo…');
  await new Promise((resolve, reject) => {
    const b = spawn(process.execPath, [astroCli, 'build'], { cwd: root, stdio: 'inherit' });
    b.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`astro build falló (${code})`))));
  });
}

async function main() {
  if (!existsSync(executablePath)) {
    throw new Error(
      `No encuentro Chromium en ${executablePath}.\n` +
        'Instala los navegadores de playwright o define CHROMIUM_PATH con la ruta a chrome.exe.',
    );
  }

  await ensureBuild();

  const server = await startServer();
  log(`servidor estático listo en ${base}`);

  try {
    const browser = await chromium.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    await mkdir(outDir, { recursive: true });
    await rm(path.join(outDir, '*'), { force: true }).catch(() => {});

    const combos = [];
    for (const theme of themes) {
      for (const motion of motions) {
        for (const viewport of viewports) {
          combos.push({ theme, motion, viewport });
        }
      }
    }

    log(`matriz: ${combos.length} captura(s)`);
    const t0 = Date.now();
    let failed = 0;

    for (const { theme, motion, viewport } of combos) {
      const file = `marslabs-${theme}-${motion}-${viewport}.png`;
      const out = path.join(outDir, file);
      const start = Date.now();
      try {
        const context = await browser.newContext({ viewport: viewportSize[viewport] });
        await context.addInitScript(
          ({ t, m }) => {
            localStorage.setItem('mars-theme', t);
            localStorage.setItem('mars-motion', m);
          },
          { t: theme, m: motion },
        );
        const page = await context.newPage();
        await page.goto(base, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);

        if (motion === 'on') {
          await page.waitForTimeout(1_600);
          await page.evaluate(async () => {
            const h = document.body.scrollHeight;
            const step = Math.max(240, Math.round(h / 30));
            for (let y = 0; y <= h; y += step) {
              window.scrollTo(0, y);
              await new Promise((r) => setTimeout(r, 25));
            }
            window.scrollTo(0, 0);
            await new Promise((r) => setTimeout(r, 300));
          });
          await page.waitForTimeout(1_200);
        } else {
          await page.waitForTimeout(500);
        }

        await page.screenshot({ path: out, fullPage: true });
        await context.close();
        log(`ok   ${file}  (${Date.now() - start} ms)`);
      } catch (err) {
        failed += 1;
        log(`fail ${file}: ${err.message}`);
      }
    }

    await browser.close();
    log(`listo: ${combos.length - failed}/${combos.length} en ${Date.now() - t0} ms`);
    log(`carpeta: ${outDir}`);
    if (failed) process.exitCode = 1;
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error(`[capture] ${err.message}`);
  process.exit(1);
});