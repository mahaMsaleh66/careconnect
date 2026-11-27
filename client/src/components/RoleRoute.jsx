import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading && !user) {
    return <p>Loading session...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="card">
        <h1>Access denied</h1>
        <p>Your {user.role} account cannot open this page.</p>
        <Link to="/dashboard" className="btn" style={{ display: 'inline-block', marginTop: 8 }}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  return children;
}
