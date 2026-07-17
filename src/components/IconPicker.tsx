import { useState } from 'react';
import AppIcon from './AppIcon';
import { imageToIconDataUrl } from '../lib/appFile';

const EMOJIS = ['📱','🎮','📝','🎨','🧮','📊','🕹️','🎵','📷','⚽','💡','🛒','📚','🔔','❤️','⭐','🚀','🍕','🧠','🗓️'];
const COLORS = ['#c6a24c','#16a6a6','#e86aa6','#f2c94c','#1c1b18','#6f6b61'];

export default function IconPicker({
  icon,
  bg,
  onChange,
}: {
  icon: string;
  bg: string;
  onChange: (icon: string, bg: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const isImage = icon.startsWith('data:');

  async function onFile(file: File | null) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Bitte ein Bild wählen.');
      return;
    }
    try {
      const dataUrl = await imageToIconDataUrl(file);
      onChange(dataUrl, bg);
    } catch {
      setError('Bild konnte nicht verarbeitet werden.');
    }
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row" style={{ gap: 14 }}>
        <AppIcon icon={icon} bg={bg} size={64} />
        <div className="stack" style={{ gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Vorschau</span>
          <span className="muted" style={{ fontSize: 12 }}>
            So erscheint deine App auf dem Startbildschirm.
          </span>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stack" style={{ gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Emoji</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onChange(e, bg)}
              style={{
                fontSize: 20,
                width: 40,
                height: 40,
                borderRadius: 9,
                cursor: 'pointer',
                background: !isImage && icon === e ? 'var(--gold-soft)' : 'var(--surface)',
                border: `1px solid ${!isImage && icon === e ? 'var(--gold)' : 'var(--border)'}`,
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="row" style={{ gap: 16, flexWrap: 'wrap' }}>
        <div className="stack" style={{ gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Hintergrundfarbe</span>
          <div className="row" style={{ gap: 6 }}>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange(icon, c)}
                aria-label={c}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: c,
                  cursor: 'pointer',
                  border: bg === c ? '3px solid var(--text)' : '1px solid var(--border)',
                }}
              />
            ))}
          </div>
        </div>

        <div className="stack" style={{ gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Eigenes Bild</span>
          <label className="btn btn-outline" style={{ fontSize: 13, cursor: 'pointer' }}>
            Bild hochladen
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
