import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type App = {
  id: string;
  name: string;
  description: string | null;
  bundle_path: string | null;
  entry_file: string;
  status: string;
  created_at: string;
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
      <div className="row">
        <div>
          <h1 style={{ fontSize: 28 }}>Meine Apps</h1>
          <p style={{ fontSize: 15 }}>
            Lade eine fertige App-Datei hoch und nutze sie direkt.
          </p>
        </div>
        <span className="spacer" />
        <button className="btn btn-gold" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Schließen' : '+ App hochladen'}
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
          <p>Noch keine App hochgeladen.</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {apps.map((a) => (
            <div key={a.id} className="card stack" style={{ gap: 10 }}>
              <div className="row">
                <h3 style={{ fontSize: 17 }}>{a.name}</h3>
                <span className="spacer" />
                <StatusBadge status={a.status} />
              </div>
              <p style={{ fontSize: 14, minHeight: 20 }}>
                {a.description || 'Keine Beschreibung'}
              </p>
              <Link to={`/app/run/${a.id}`} className="btn btn-outline btn-block">
                Öffnen
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'badge badge-yellow',
    approved: 'badge badge-turquoise',
    rejected: 'badge badge-pink',
  };
  const label: Record<string, string> = {
    pending: 'In Prüfung',
    approved: 'Freigegeben',
    rejected: 'Abgelehnt',
  };
  return <span className={map[status] ?? 'badge badge-muted'}>{label[status] ?? status}</span>;
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
      <h3 style={{ fontSize: 17 }}>Neue App hochladen</h3>
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
          Eine einzelne .html-Datei kann sofort geöffnet werden. .zip-Bundles
          werden gespeichert (Ausführung folgt).
        </span>
      </div>
      <button className="btn btn-gold btn-block" disabled={busy}>
        {busy ? 'Wird hochgeladen…' : 'Hochladen'}
      </button>
    </form>
  );
}
