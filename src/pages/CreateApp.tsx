import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const STARTER = `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Meine App</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 24px; text-align: center; }
      button { padding: 12px 20px; font-size: 16px; border-radius: 10px;
               border: none; background: #c6a24c; color: #fff; cursor: pointer; }
    </style>
  </head>
  <body>
    <h1>Hallo 👋</h1>
    <p id="out">Tippe auf den Knopf.</p>
    <button onclick="document.getElementById('out').textContent = 'Es funktioniert!'">
      Los
    </button>
  </body>
</html>`;

export default function CreateApp() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const uid = session!.user.id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState(STARTER);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setError(null);
    if (!name.trim()) {
      setError('Bitte gib deiner App einen Namen.');
      return;
    }
    if (!code.trim()) {
      setError('Der Code ist leer.');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from('apps')
      .insert({
        owner_id: uid,
        name,
        description,
        content: code,
        source: 'editor',
        entry_file: 'index.html',
        status: 'pending',
      })
      .select('id')
      .single();
    setBusy(false);
    if (error) {
      setError('Speichern fehlgeschlagen: ' + error.message);
      return;
    }
    navigate(`/app/run/${data.id}`);
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="row">
        <div>
          <h1 style={{ fontSize: 28 }}>App erstellen</h1>
          <p style={{ fontSize: 15 }}>
            Code direkt einfügen — links schreiben, rechts live sehen.
          </p>
        </div>
        <span className="spacer" />
        <button className="btn btn-outline" onClick={() => navigate('/app')}>
          Abbrechen
        </button>
        <button className="btn btn-gold" onClick={save} disabled={busy}>
          {busy ? 'Speichert…' : 'Speichern & öffnen'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-2" style={{ alignItems: 'stretch' }}>
        <div className="field">
          <label>Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Beschreibung (optional)</label>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-2" style={{ minHeight: 460 }}>
        <div className="field" style={{ height: '100%' }}>
          <label>Code (HTML / CSS / JS)</label>
          <textarea
            className="input"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              flex: 1,
              minHeight: 420,
              fontFamily: 'ui-monospace, Consolas, monospace',
              fontSize: 13,
              lineHeight: 1.5,
              background: '#1c1b18',
              color: '#f3ead2',
              resize: 'vertical',
            }}
          />
        </div>
        <div className="field" style={{ height: '100%' }}>
          <label>Live-Vorschau</label>
          <div
            style={{
              flex: 1,
              minHeight: 420,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <iframe
              title="Vorschau"
              srcDoc={code}
              sandbox="allow-scripts allow-forms allow-modals"
              style={{ border: 'none', width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
