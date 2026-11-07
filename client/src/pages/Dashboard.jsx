import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="auth-box">
      <h2>Welcome, {user.name}</h2>
      <p>Your role: <b>{user.role}</b></p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}