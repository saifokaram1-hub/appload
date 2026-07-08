import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

type Row = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  owner_id: string;
  ownerEmail: string;
};

export default function AdminApps() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: apps }, { data: profiles }] = await Promise.all([
      supabase.from('apps').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, email'),
    ]);
    const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));
    setRows(
      (apps ?? []).map((a) => ({
        ...(a as Omit<Row, 'ownerEmail'>),
        ownerEmail: emailById.get(a.owner_id) ?? '—',
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    await supabase.from('apps').update({ status }).eq('id', id);
    load();
  }

  async function remove(id: string) {
    await supabase.from('apps').delete().eq('id', id);
    load();
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 28 }}>Projekte</h1>
        <p style={{ fontSize: 15 }}>Alle hochgeladenen Apps prüfen und freigeben.</p>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <p className="muted" style={{ padding: 20 }}>
            Lädt…
          </p>
        ) : rows.length === 0 ? (
          <p className="muted" style={{ padding: 20 }}>
            Noch keine Projekte.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>App</th>
                <th>Besitzer</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {r.description || '—'}
                    </div>
                  </td>
                  <td className="muted" style={{ fontSize: 13 }}>
                    {r.ownerEmail}
                  </td>
                  <td>
                    {r.status === 'approved' ? (
                      <span className="badge badge-turquoise">Freigegeben</span>
                    ) : r.status === 'rejected' ? (
                      <span className="badge badge-pink">Abgelehnt</span>
                    ) : (
                      <span className="badge badge-yellow">In Prüfung</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                      <Link to={`/app/run/${r.id}`} className="btn btn-ghost" style={{ fontSize: 13 }}>
                        Ansehen
                      </Link>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 13, color: 'var(--success)' }}
                        onClick={() => setStatus(r.id, 'approved')}
                      >
                        Freigeben
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 13, color: 'var(--pink)' }}
                        onClick={() => setStatus(r.id, 'rejected')}
                      >
                        Ablehnen
                      </button>
                      {isAdmin && (
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: 13, color: 'var(--danger)' }}
                          onClick={() => remove(r.id)}
                        >
                          Löschen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
