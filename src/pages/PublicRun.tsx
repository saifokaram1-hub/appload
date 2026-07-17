import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { resolveAppHtml } from '../lib/appFile';
import Logo from '../components/Logo';

export default function PublicRun() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('App');
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const { data: app } = await supabase
        .from('apps')
        .select('id, name, content, bundle_path, is_public')
        .eq('id', id)
        .eq('is_public', true)
        .maybeSingle();

      if (cancelled) return;
      if (!app) {
        setError('Diese App ist nicht (mehr) öffentlich verfügbar.');
        setLoading(false);
        return;
      }
      setName(app.name);
      const { html, error } = await resolveAppHtml(app);
      if (cancelled) return;
      setHtml(html);
      setError(error);
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
          height: 52,
          padding: '0 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <b style={{ fontSize: 15 }}>{name}</b>
        <span className="spacer" />
        <Link to="/" className="row" style={{ gap: 6, fontSize: 12, color: 'var(--muted)' }}>
          <span>läuft mit</span>
          <Logo size={16} />
        </Link>
      </header>
      <div style={{ flex: 1, position: 'relative', background: '#fff' }}>
        {loading && (
          <div className="center-screen">
            <p className="muted">Lädt…</p>
          </div>
        )}
        {error && (
          <div className="center-screen">
            <div className="card" style={{ maxWidth: 440, textAlign: 'center' }}>
              <div className="alert alert-info">{error}</div>
            </div>
          </div>
        )}
        {html && !error && (
          <iframe
            title={name}
            srcDoc={html}
            sandbox="allow-scripts allow-forms allow-popups allow-modals"
            style={{ border: 'none', width: '100%', height: '100%', position: 'absolute', inset: 0 }}
          />
        )}
      </div>
    </div>
  );
}
