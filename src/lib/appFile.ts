import { supabase } from './supabase';

export type AppRecord = {
  id: string;
  name: string;
  content: string | null;
  bundle_path: string | null;
};

/**
 * Liefert das HTML einer App:
 * - im Editor erstellte Apps: direkt aus `content`
 * - hochgeladene .html: über eine signierte URL aus dem Storage
 * .zip-Bundles werden (noch) nicht direkt ausgeführt.
 */
export async function resolveAppHtml(
  app: AppRecord,
): Promise<{ html: string | null; error: string | null }> {
  if (app.content && app.content.trim().length > 0) {
    return { html: app.content, error: null };
  }
  const path = app.bundle_path;
  if (!path) return { html: null, error: 'Keine Datei vorhanden.' };

  const isHtml = path.toLowerCase().endsWith('.html') || path.toLowerCase().endsWith('.htm');
  if (!isHtml) {
    return {
      html: null,
      error:
        'Diese App liegt als .zip-Bundle vor. Direkt ausführen lässt sich derzeit eine einzelne .html-Datei oder im Editor erstellter Code.',
    };
  }

  const { data: signed, error } = await supabase.storage
    .from('app-bundles')
    .createSignedUrl(path, 60);
  if (error || !signed) return { html: null, error: 'Datei konnte nicht geladen werden.' };

  try {
    const res = await fetch(signed.signedUrl);
    return { html: await res.text(), error: null };
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
