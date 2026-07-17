import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { resolveAppHtml, downloadHtml, publicShareUrl } from '../lib/appFile';

type App = {
  id: string;
  name: string;
  owner_id: string;
  content: string | null;
  bundle_path: string | null;
  entry_file: string;
  is_public: boolean;
};

export default function AppRunner() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const [app, setApp] = useState<App | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = !!app && app.owner_id === session?.user.id;

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      const { data: appRow, error: appErr } = await supabase
        .from('apps')
        .select('id, name, owner_id, content, bundle_path, entry_file, is_public')
        .eq('id', id)
        .maybeSingle();

      if (cancelled) return;
      if (appErr || !appRow) {
        setError('App nicht gefunden oder kein Zugriff.');
        setLoading(false);
        return;
      }
      setApp(appRow as App);
      setIsPublic((appRow as App).is_public);

      const { html, error } = await resolveAppHtml(appRow as App);
      if (cancelled) return;
      setHtml(html);
      if (error) setError(error);
      setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function togglePublic() {
    if (!app) return;
    const next = !isPublic;
    setIsPublic(next);
    const { error } = await supabase.from('apps').update({ is_public: next }).eq('id', app.id);
    if (error) setIsPublic(!next); // zurückrollen bei Fehler
  }

  function exportFile() {
    if (app && html) downloadHtml(app.name, html);
  }

  async function copyLink() {
    if (!app) return;
    try {
      await navigator.clipboard.writeText(publicShareUrl(app.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        className="row"
        style={{
          minHeight: 56,
          flexWrap: 'wrap',
          padding: '8px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <Link to="/app" className="btn btn-ghost">
          ← Zurück
        </Link>
        <b style={{ fontSize: 15 }}>{app?.name ?? 'App'}</b>
        <span className="spacer" />
        {html && (
          <button className="btn btn-outline" style={{ fontSize: 13 }} onClick={exportFile}>
            Als Datei exportieren
          </button>
        )}
        {isOwner && (
          <>
            <button
              className={isPublic ? 'btn btn-gold' : 'btn btn-outline'}
              style={{ fontSize: 13 }}
              onClick={togglePublic}
            >
              {isPublic ? '● Öffentlich' : 'Öffentlich teilen'}
            </button>
            {isPublic && (
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={copyLink}>
                {copied ? '✓ Kopiert' : 'Link kopieren'}
              </button>
            )}
          </>
        )}
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
