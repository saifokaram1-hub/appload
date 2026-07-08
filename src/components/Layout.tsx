import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { role, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isStaff = role === 'admin' || role === 'support';

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          className="container row"
          style={{ height: 64 }}
        >
          <Link to="/app" style={{ textDecoration: 'none' }}>
            <Logo size={22} />
          </Link>
          <nav className="row" style={{ gap: 4, marginLeft: 20 }}>
            <NavItem to="/app" label="Meine Apps" />
            {isStaff && <NavItem to="/admin/users" label="Nutzer" />}
            {isStaff && <NavItem to="/admin/apps" label="Projekte" />}
          </nav>
          <span className="spacer" />
          {role && (
            <span
              className={
                role === 'admin'
                  ? 'badge badge-gold'
                  : role === 'support'
                    ? 'badge badge-turquoise'
                    : 'badge badge-muted'
              }
            >
              {role === 'admin'
                ? 'Admin'
                : role === 'support'
                  ? 'Support'
                  : 'User'}
            </span>
          )}
          <span
            className="muted"
            style={{ fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {profile?.email}
          </span>
          <button className="btn btn-ghost" onClick={handleSignOut}>
            Abmelden
          </button>
        </div>
      </header>
      <main style={{ flex: 1, padding: '28px 0 60px' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        padding: '7px 12px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        textDecoration: 'none',
        color: isActive ? 'var(--gold-dark)' : 'var(--muted)',
        background: isActive ? 'var(--gold-soft)' : 'transparent',
      })}
    >
      {label}
    </NavLink>
  );
}
