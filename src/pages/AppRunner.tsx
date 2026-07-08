import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type App = {
  id: string;
  name: string;
  bundle_path: string | null;
  entry_file: string;
};

export default function AppRunner() {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<App | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      const { data: appRow, error: appErr } = await supabase
        .from('apps')
        .select('id, name, bundle_path, entry_file')
        .eq('id', id)
        .maybeSingle();

      if (cancelled) return;
      if (appErr || !appRow) {
        setError('App nicht gefunden oder kein Zugriff.');
        setLoading(false);
        return;
      }
      setApp(appRow as App);

      const path = (appRow as App).bundle_path;
      if (!path) {
        setError('Für diese App wurde keine Datei gefunden.');
        setLoading(false);
        return;
      }

      const isHtml = path.toLowerCase().endsWith('.html') || path.toLowerCase().endsWith('.htm');
      if (!isHtml) {
        setError(
          'Diese App liegt als .zip-Bundle vor. Das direkte Ausführen von Bundles ist der nächste Ausbauschritt — eine einzelne .html-Datei läuft bereits vollständig.',
        );
        setLoading(false);
        return;
      }

      const { data: signed, error: signErr } = await supabase.storage
        .from('app-bundles')
        .createSignedUrl(path, 60);

      if (cancelled) return;
      if (signErr || !signed) {
        setError('Datei konnte nicht geladen werden.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(signed.signedUrl);
        const text = await res.text();
        if (cancelled) return;
        setHtml(text);
      } catch {
        if (!cancelled) setError('Datei konnte nicht gelesen werden.');
      }
      setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        className="row"
        style={{
          height: 56,
          padding: '0 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <Link to="/app" className="btn btn-ghost">
          ← Zurück
        </Link>
        <span className="spacer" />
        <b style={{ fontSize: 15 }}>{app?.name ?? 'App'}</b>
        <span className="spacer" />
      </header>

      <div style={{ flex: 1, position: 'relative', background: '#fff' }}>
        {loading && (
          <div className="center-screen">
            <p className="muted">App wird geladen…</p>
          </div>
        )}
        {error && (
          <div className="center-screen">
            <div className="card" style={{ maxWidth: 460, textAlign: 'center' }}>
              <div className="alert alert-info">{error}</div>
            </div>
          </div>
        )}
        {html && !error && (
          <iframe
            title={app?.name ?? 'App'}
            srcDoc={html}
            sandbox="allow-scripts allow-forms allow-popups allow-modals"
            style={{ border: 'none', width: '100%', height: '100%', position: 'absolute', inset: 0 }}
          />
        )}
      </div>
    </div>
  );
}
