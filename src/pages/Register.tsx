import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    });
    setLoading(false);
    if (error) {
      setError(
        error.message.includes('already registered')
          ? 'Diese E-Mail ist bereits registriert.'
          : 'Registrierung fehlgeschlagen: ' + error.message,
      );
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="center-screen">
        <div className="stack" style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ marginBottom: 8 }}>
            <Logo />
          </div>
          <div className="card stack">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--turquoise-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontSize: 26,
              }}
            >
              ✉️
            </div>
            <h2>Fast geschafft!</h2>
            <p>
              Wir haben dir eine Bestätigungs-E-Mail an <b>{email}</b> geschickt.
              Klicke den Link darin, um dein Konto zu aktivieren. Danach kannst du
              dich anmelden.
            </p>
            <Link to="/login" className="btn btn-outline btn-block">
              Zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="center-screen">
      <div className="stack" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Link to="/">
            <Logo />
          </Link>
        </div>
        <div className="card stack">
          <h2>Konto erstellen</h2>
          <p style={{ fontSize: 14 }}>
            Der erste registrierte Nutzer wird automatisch <b>Admin</b>.
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="stack">
            <div className="field">
              <label>Name</label>
              <input
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="field">
              <label>E-Mail</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label>Passwort</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <button className="btn btn-gold btn-block" disabled={loading}>
              {loading ? 'Wird erstellt…' : 'Registrieren'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', fontSize: 14 }}>
          Schon ein Konto? <Link to="/login">Anmelden</Link>
        </p>
      </div>
    </div>
  );
}
