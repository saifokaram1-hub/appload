import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="container row" style={{ height: 72 }}>
        <Logo />
        <span className="spacer" />
        <Link to="/login" className="btn btn-ghost">
          Anmelden
        </Link>
        <Link to="/register" className="btn btn-gold">
          Loslegen
        </Link>
      </header>

      <section
        className="container"
        style={{ padding: '48px 20px 24px', textAlign: 'center', maxWidth: 780 }}
      >
        <span className="badge badge-gold" style={{ marginBottom: 20 }}>
          Deine App, ohne Umwege
        </span>
        <h1 style={{ fontSize: 'clamp(34px, 6vw, 60px)', marginBottom: 18 }}>
          Lade deinen Code hoch —{' '}
          <span style={{ color: 'var(--gold-dark)' }}>fertig ist die App.</span>
        </h1>
        <p style={{ fontSize: 18, maxWidth: 620, margin: '0 auto 32px' }}>
          Appload verwandelt eine fertige Code-Datei in eine nutzbare App —
          direkt auf dem Handy, ohne eigenen Entwickler-Account und ohne
          komplizierten Aufbau. Hochladen, öffnen, benutzen.
        </p>
        <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
          <Link to="/register" className="btn btn-gold" style={{ padding: '14px 26px' }}>
            Kostenlos starten
          </Link>
          <Link to="/login" className="btn btn-outline" style={{ padding: '14px 26px' }}>
            Ich habe schon ein Konto
          </Link>
        </div>
      </section>

      <section className="container" style={{ padding: '32px 20px 64px' }}>
        <div className="grid grid-3">
          <Feature
            color="gold"
            title="Hochladen"
            text="Deine fertige App-Datei (z. B. ein Web-Bundle als ZIP) einfach hochladen."
          />
          <Feature
            color="turquoise"
            title="Verwalten"
            text="Alle deine Apps an einem Ort. Admins behalten den Überblick über Nutzer & Projekte."
          />
          <Feature
            color="pink"
            title="Benutzen"
            text="Öffne deine App sofort in Appload — als wäre sie extra für dich gebaut."
          />
        </div>
      </section>

      <footer
        className="container muted"
        style={{ padding: '24px 20px', borderTop: '1px solid var(--border)', fontSize: 13 }}
      >
        © {new Date().getFullYear()} Appload
      </footer>
    </div>
  );
}

function Feature({
  color,
  title,
  text,
}: {
  color: 'gold' | 'turquoise' | 'pink';
  title: string;
  text: string;
}) {
  return (
    <div className="card stack" style={{ gap: 10 }}>
      <span className={`badge badge-${color}`} style={{ alignSelf: 'flex-start' }}>
        {title}
      </span>
      <p style={{ fontSize: 15 }}>{text}</p>
    </div>
  );
}
