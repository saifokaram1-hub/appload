import { unzipSync } from 'fflate';
import { supabase } from './supabase';

export type AppRecord = {
  id: string;
  name: string;
  content: string | null;
  bundle_path: string | null;
  entry_file?: string;
};

const MIME: Record<string, string> = {
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  mjs: 'text/javascript',
  json: 'application/json',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  mp4: 'video/mp4',
  txt: 'text/plain',
};

function extOf(path: string): string {
  const m = path.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[],
    );
  }
  return btoa(bin);
}

/**
 * Entpackt ein ZIP im Browser und baut daraus eine einzelne, in sich
 * geschlossene HTML-Datei: alle Assets (CSS/JS/Bilder) werden als data:-URLs
 * eingebettet. So läuft das Bundle auch im streng abgesicherten iframe.
 * Best effort — sehr komplexe Bundles mit dynamischen Pfaden können abweichen.
 */
function zipToHtml(
  zipBytes: Uint8Array,
  entryFile?: string,
): { html: string | null; error: string | null } {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(zipBytes);
  } catch {
    return { html: null, error: 'ZIP konnte nicht entpackt werden.' };
  }

  const paths = Object.keys(files).filter((p) => !p.endsWith('/'));
  // Einstiegsdatei finden
  const wanted = (entryFile || 'index.html').toLowerCase();
  let entry =
    paths.find((p) => p.toLowerCase() === wanted) ||
    paths.find((p) => p.toLowerCase().endsWith('/' + wanted)) ||
    paths.find((p) => p.toLowerCase().endsWith('index.html')) ||
    paths.find((p) => p.toLowerCase().endsWith('.html'));

  if (!entry) return { html: null, error: 'Keine index.html im ZIP gefunden.' };

  let html = new TextDecoder().decode(files[entry]);
  const entryDir = entry.includes('/') ? entry.slice(0, entry.lastIndexOf('/') + 1) : '';

  // Assets als data:-URLs vorbereiten (längste Pfade zuerst ersetzen)
  const assets = paths
    .filter((p) => p !== entry)
    .sort((a, b) => b.length - a.length);

  for (const p of assets) {
    const dataUrl = `data:${MIME[extOf(p)] || 'application/octet-stream'};base64,${toBase64(files[p])}`;
    // Kandidaten-Referenzen: absolut im ZIP und relativ zur Einstiegsdatei
    const rel = entryDir && p.startsWith(entryDir) ? p.slice(entryDir.length) : p;
    const refs = new Set([p, './' + p, '/' + p, rel, './' + rel, '/' + rel]);
    for (const r of refs) {
      html = html.split('"' + r + '"').join('"' + dataUrl + '"');
      html = html.split("'" + r + "'").join("'" + dataUrl + "'");
      html = html.split('(' + r + ')').join('(' + dataUrl + ')');
    }
  }
  return { html, error: null };
}

/**
 * Liefert das HTML einer App:
 * - im Editor erstellte Apps: direkt aus `content`
 * - hochgeladene .html: über eine signierte URL aus dem Storage
 * - hochgeladene .zip: im Browser entpackt und eingebettet
 */
export async function resolveAppHtml(
  app: AppRecord,
): Promise<{ html: string | null; error: string | null }> {
  if (app.content && app.content.trim().length > 0) {
    return { html: app.content, error: null };
  }
  const path = app.bundle_path;
  if (!path) return { html: null, error: 'Keine Datei vorhanden.' };

  const lower = path.toLowerCase();
  const isHtml = lower.endsWith('.html') || lower.endsWith('.htm');
  const isZip = lower.endsWith('.zip');
  if (!isHtml && !isZip) {
    return { html: null, error: 'Nicht unterstütztes Format (nur .html oder .zip).' };
  }

  const { data: signed, error } = await supabase.storage
    .from('app-bundles')
    .createSignedUrl(path, 60);
  if (error || !signed) return { html: null, error: 'Datei konnte nicht geladen werden.' };

  try {
    const res = await fetch(signed.signedUrl);
    if (isHtml) return { html: await res.text(), error: null };
    const buf = new Uint8Array(await res.arrayBuffer());
    return zipToHtml(buf, app.entry_file);
  } catch {
    return { html: null, error: 'Datei konnte nicht gelesen werden.' };
  }
}

/** Lädt HTML als .html-Datei herunter (zum Teilen/Weitergeben). */
export function downloadHtml(name: string, html: string) {
  const safe = (name || 'app').replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safe}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Öffentlicher Teilen-Link (funktioniert ohne Login). */
export function publicShareUrl(id: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}#/p/${id}`;
}

/** Verkleinert ein Bild auf ein quadratisches Icon (als data:-URL). */
export function imageToIconDataUrl(file: File, size = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas nicht verfügbar'));
        return;
      }
      // quadratisch zuschneiden (cover)
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Bild konnte nicht geladen werden'));
    };
    img.src = url;
  });
}
