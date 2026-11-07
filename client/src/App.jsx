import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import DashboardHome from './pages/DashboardHome';
import Crises from './pages/Crises';
import Donations from './pages/Donations';
import HelpRequests from './pages/HelpRequests';
import VolunteerProfile from './pages/VolunteerProfile';
import Tasks from './pages/Tasks';
import News from './pages/News';
import Reports from './pages/Reports';
import Feedback from './pages/Feedback';
import Account from './pages/Account';
import Users from './pages/Users';

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="crises" element={<Crises />} />
            <Route path="donations" element={<Donations />} />
            <Route path="requests" element={<HelpRequests />} />
            <Route path="profile" element={<VolunteerProfile />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="news" element={<News />} />
            <Route path="reports" element={<Reports />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="account" element={<Account />} />
            <Route path="users" element={<Users />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}