import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth, type Role } from '../../context/AuthContext';

type Row = {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  created_at: string;
  role: Role | null;
};

export default function AdminUsers() {
  const { role: myRole, session } = useAuth();
  const isAdmin = myRole === 'admin';
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      supabase.from('user_roles').select('user_id, role'),
    ]);
    const roleByUser = new Map<string, Role>();
    (roles ?? []).forEach((r) => {
      const existing = roleByUser.get(r.user_id);
      const rank: Record<Role, number> = { admin: 3, support: 2, user: 1 };
      if (!existing || rank[r.role as Role] > rank[existing]) {
        roleByUser.set(r.user_id, r.role as Role);
      }
    });
    setRows(
      (profiles ?? []).map((p) => ({
        ...(p as Omit<Row, 'role'>),
        role: roleByUser.get(p.id) ?? null,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeRole(userId: string, newRole: Role) {
    setMsg(null);
    await supabase.from('user_roles').delete().eq('user_id', userId);
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: newRole });
    if (error) setMsg('Fehler: ' + error.message);
    else setMsg('Rolle aktualisiert.');
    load();
  }

  async function toggleStatus(row: Row) {
    const next = row.status === 'active' ? 'banned' : 'active';
    const { error } = await supabase.from('profiles').update({ status: next }).eq('id', row.id);
    if (error) setMsg('Fehler: ' + error.message);
    load();
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 28 }}>Nutzer</h1>
        <p style={{ fontSize: 15 }}>
          {isAdmin
            ? 'Verwalte Konten, vergebe Rollen und sperre Nutzer.'
            : 'Übersicht aller Konten (nur Lesen).'}
        </p>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <p className="muted" style={{ padding: 20 }}>
            Lädt…
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name / E-Mail</th>
                <th>Rolle</th>
                <th>Status</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Aktionen</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isSelf = r.id === session!.user.id;
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.full_name || '—'}</div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {r.email}
                      </div>
                    </td>
                    <td>
                      <RoleBadge role={r.role} />
                    </td>
                    <td>
                      {r.status === 'active' ? (
                        <span className="badge badge-turquoise">Aktiv</span>
                      ) : (
                        <span className="badge badge-pink">Gesperrt</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                          <select
                            className="input"
                            style={{ width: 'auto', padding: '6px 8px', fontSize: 13 }}
                            value={r.role ?? 'user'}
                            disabled={isSelf}
                            onChange={(e) => changeRole(r.id, e.target.value as Role)}
                          >
                            <option value="user">User</option>
                            <option value="support">Support</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: 13 }}
                            disabled={isSelf}
                            onClick={() => toggleStatus(r)}
                          >
                            {r.status === 'active' ? 'Sperren' : 'Freigeben'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: Role | null }) {
  if (role === 'admin') return <span className="badge badge-gold">Admin</span>;
  if (role === 'support') return <span className="badge badge-turquoise">Support</span>;
  return <span className="badge badge-muted">User</span>;
}
