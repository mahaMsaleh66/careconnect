import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './AuthContext';
import { LanguageProvider } from './LanguageContext';
import { SocketProvider } from './SocketContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import FloodSindh from './pages/FloodSindh';
import ExplorePage from './pages/ExplorePage';
import Layout from './components/Layout';
import RoleRoute from './components/RoleRoute';
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
import PaymentAccounts from './pages/PaymentAccounts';
import FloodMonitor from './pages/FloodMonitor';

const ALL_ROLES = ['admin', 'donor', 'volunteer', 'needy'];
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading && !user) {
    return <p>Loading session...</p>;
  }
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <AuthProvider>
      <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/flood-sindh" element={<FloodSindh />} />
          <Route path="/explore/:slug" element={<ExplorePage />} />
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
            <Route
              path="crises"
              element={
                <RoleRoute allowedRoles={ALL_ROLES}>
                  <Crises />
                </RoleRoute>
              }
            />
            <Route
              path="donations"
              element={
                <RoleRoute allowedRoles={['donor', 'admin']}>
                  <Donations />
                </RoleRoute>
              }
            />
            <Route
              path="requests"
              element={
                <RoleRoute allowedRoles={['needy', 'admin']}>
                  <HelpRequests />
                </RoleRoute>
              }
            />
            <Route
              path="profile"
              element={
                <RoleRoute allowedRoles={['volunteer']}>
                  <VolunteerProfile />
                </RoleRoute>
              }
            />
            <Route
              path="tasks"
              element={
                <RoleRoute allowedRoles={['admin', 'volunteer']}>
                  <Tasks />
                </RoleRoute>
              }
            />
            <Route
              path="news"
              element={
                <RoleRoute allowedRoles={ALL_ROLES}>
                  <News />
                </RoleRoute>
              }
            />
            <Route
              path="flood"
              element={
                <RoleRoute allowedRoles={ALL_ROLES}>
                  <FloodMonitor />
                </RoleRoute>
              }
            />
            <Route
              path="reports"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <Reports />
                </RoleRoute>
              }
            />
            <Route
              path="feedback"
              element={
                <RoleRoute allowedRoles={ALL_ROLES}>
                  <Feedback />
                </RoleRoute>
              }
            />
            <Route
              path="account"
              element={
                <RoleRoute allowedRoles={ALL_ROLES}>
                  <Account />
                </RoleRoute>
              }
            />
            <Route
              path="users"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <Users />
                </RoleRoute>
              }
            />
            <Route
              path="payment-accounts"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <PaymentAccounts />
                </RoleRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default function App() {
  const routes = GOOGLE_CLIENT_ID ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppRoutes />
    </GoogleOAuthProvider>
  ) : (
    <AppRoutes />
  );
  return <LanguageProvider>{routes}</LanguageProvider>;
}
