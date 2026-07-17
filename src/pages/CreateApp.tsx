import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import IconPicker from '../components/IconPicker';

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
  const { id } = useParams<{ id: string }>();
  const editMode = !!id;
  const { session } = useAuth();
  const uid = session!.user.id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📱');
  const [iconBg, setIconBg] = useState('#c6a24c');
  const [code, setCode] = useState(STARTER);
  const [isEditorApp, setIsEditorApp] = useState(true); // false = hochgeladene Datei
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editMode);

  useEffect(() => {
    if (!editMode) return;
    (async () => {
      const { data, error } = await supabase
        .from('apps')
        .select('name, description, icon, icon_bg, content, source')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) {
        setError('App nicht gefunden oder kein Zugriff.');
        setLoading(false);
        return;
      }
      setName(data.name ?? '');
      setDescription(data.description ?? '');
      setIcon(data.icon ?? '📱');
      setIconBg(data.icon_bg ?? '#c6a24c');
      const editorApp = !!data.content || data.source === 'editor';
      setIsEditorApp(editorApp);
      if (data.content) setCode(data.content);
      setLoading(false);
    })();
  }, [editMode, id]);

  async function save() {
    setError(null);
    if (!name.trim()) {
      setError('Bitte gib deiner App einen Namen.');
      return;
    }
    if (isEditorApp && !code.trim()) {
      setError('Der Code ist leer.');
      return;
    }
    setBusy(true);

    if (editMode) {
      const patch: Record<string, unknown> = {
        name,
        description,
        icon,
        icon_bg: iconBg,
      };
      if (isEditorApp) patch.content = code;
      const { error } = await supabase.from('apps').update(patch).eq('id', id);
      setBusy(false);
      if (error) return setError('Speichern fehlgeschlagen: ' + error.message);
      navigate(`/app/run/${id}`);
      return;
    }

    const { data, error } = await supabase
      .from('apps')
      .insert({
        owner_id: uid,
        name,
        description,
        icon,
        icon_bg: iconBg,
        content: code,
        source: 'editor',
        entry_file: 'index.html',
        status: 'pending',
      })
      .select('id')
      .single();
    setBusy(false);
    if (error) return setError('Speichern fehlgeschlagen: ' + error.message);
    navigate(`/app/run/${data.id}`);
  }

  if (loading) return <p className="muted">Lädt…</p>;

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="row">
        <div>
          <h1 style={{ fontSize: 28 }}>{editMode ? 'App bearbeiten' : 'App erstellen'}</h1>
          <p style={{ fontSize: 15 }}>
            {isEditorApp
              ? 'Code links schreiben, rechts live sehen. Name & Icon frei wählen.'
              : 'Name & Icon dieser hochgeladenen App anpassen.'}
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

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <div className="field">
            <label>Name der App</label>
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
        <div className="card">
          <div className="field" style={{ marginBottom: 10 }}>
            <label>App-Icon</label>
          </div>
          <IconPicker
            icon={icon}
            bg={iconBg}
            onChange={(i, b) => {
              setIcon(i);
              setIconBg(b);
            }}
          />
        </div>
      </div>

      {isEditorApp ? (
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
      ) : (
        <div className="alert alert-info">
          Diese App wurde als Datei hochgeladen — der Inhalt wird nicht im Editor
          bearbeitet. Name und Icon kannst du oben ändern.
        </div>
      )}
    </div>
  );
}
