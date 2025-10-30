import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1 style={{ fontSize: '4rem' }}>404</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Page not found</p>
      <Link
        to="/"
        style={{
          color: '#1976d2',
          textDecoration: 'none',
          fontSize: '1.125rem',
        }}
      >
        Go back home
      </Link>
    </div>
  );
}
