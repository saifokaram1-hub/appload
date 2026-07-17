import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import AppIcon from '../components/AppIcon';

type App = {
  id: string;
  name: string;
  description: string | null;
  bundle_path: string | null;
  entry_file: string;
  status: string;
  icon: string;
  icon_bg: string;
};

export default function Dashboard() {
  const { session } = useAuth();
  const uid = session!.user.id;

  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('apps')
      .select('*')
      .eq('owner_id', uid)
      .order('created_at', { ascending: false });
    setApps((data as App[]) ?? []);
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Meine Apps</h1>
          <p style={{ fontSize: 15 }}>
            Erstelle beliebig viele Apps — jede mit eigenem Namen und Icon.
          </p>
        </div>
        <span className="spacer" />
        <Link to="/app/create" className="btn btn-gold">
          + App erstellen
        </Link>
        <button className="btn btn-outline" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Schließen' : 'Datei hochladen'}
        </button>
      </div>

      {showForm && (
        <UploadForm
          uid={uid}
          onDone={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="muted">Lädt…</p>
      ) : apps.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p>Noch keine App. Tippe auf „+ App erstellen".</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
            gap: 20,
          }}
        >
          {apps.map((a) => (
            <HomeTile key={a.id} app={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function HomeTile({ app }: { app: App }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <button
        onClick={() => navigate(`/app/run/${app.id}`)}
        title={app.name}
        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
      >
        <AppIcon icon={app.icon} bg={app.icon_bg} size={64} />
      </button>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'center',
          maxWidth: 92,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {app.name}
      </div>
      <Link to={`/app/edit/${app.id}`} style={{ fontSize: 12, color: 'var(--muted)' }}>
        Bearbeiten
      </Link>
    </div>
  );
}

function UploadForm({ uid, onDone }: { uid: string; onDone: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('Bitte wähle eine Datei aus.');
      return;
    }
    const lower = file.name.toLowerCase();
    const isHtml = lower.endsWith('.html') || lower.endsWith('.htm');
    const isZip = lower.endsWith('.zip');
    if (!isHtml && !isZip) {
      setError('Erlaubt sind .html oder .zip Dateien.');
      return;
    }

    setBusy(true);
    const appId = crypto.randomUUID();
    const path = `${uid}/${appId}/${file.name}`;

    const { error: upErr } = await supabase.storage
      .from('app-bundles')
      .upload(path, file, { upsert: true });

    if (upErr) {
      setBusy(false);
      setError('Upload fehlgeschlagen: ' + upErr.message);
      return;
    }

    const { error: dbErr } = await supabase.from('apps').insert({
      id: appId,
      owner_id: uid,
      name,
      description,
      bundle_path: path,
      entry_file: isHtml ? file.name : 'index.html',
      icon: '📦',
      source: 'upload',
      status: 'pending',
    });

    setBusy(false);
    if (dbErr) {
      setError('Speichern fehlgeschlagen: ' + dbErr.message);
      return;
    }
    onDone();
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <h3 style={{ fontSize: 17 }}>Datei hochladen</h3>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="field">
        <label>Name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="field">
        <label>Beschreibung (optional)</label>
        <input
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Datei (.html oder .zip)</label>
        <input
          className="input"
          type="file"
          accept=".html,.htm,.zip"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
        />
        <span className="muted" style={{ fontSize: 12 }}>
          .html und .zip laufen direkt. Name & Icon kannst du danach über „Bearbeiten" anpassen.
        </span>
      </div>
      <button className="btn btn-gold btn-block" disabled={busy}>
        {busy ? 'Wird hochgeladen…' : 'Hochladen'}
      </button>
    </form>
  );
}
