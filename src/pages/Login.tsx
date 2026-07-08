import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(
        error.message.includes('Email not confirmed')
          ? 'Bitte bestätige zuerst deine E-Mail-Adresse.'
          : 'Anmeldung fehlgeschlagen. E-Mail oder Passwort falsch.',
      );
      return;
    }
    navigate('/app');
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
          <h2>Willkommen zurück</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="stack">
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
                autoComplete="current-password"
              />
            </div>
            <button className="btn btn-gold btn-block" disabled={loading}>
              {loading ? 'Wird angemeldet…' : 'Anmelden'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', fontSize: 14 }}>
          Noch kein Konto? <Link to="/register">Jetzt registrieren</Link>
        </p>
      </div>
    </div>
  );
}
