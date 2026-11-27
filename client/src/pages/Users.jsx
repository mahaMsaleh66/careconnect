import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

const ROLES = ['admin', 'donor', 'volunteer', 'needy'];

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not load users');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const isActive = (u) => Number(u.is_active) !== 0;

  const changeRole = async (u, role) => {
    if (role === u.role) return;
    if (!window.confirm('Change ' + u.name + "'s role from " + u.role + ' to ' + role + '?')) {
      return;
    }
    try {
      await api.put('/users/' + u.id + '/role', { role: role });
      setMsg('Role updated');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not update role');
    }
  };

  const changeStatus = async (u) => {
    const next = isActive(u) ? 0 : 1;
    const action = next === 0 ? 'Deactivate' : 'Activate';
    if (!window.confirm(action + ' ' + u.name + '?')) return;
    try {
      await api.put('/users/' + u.id + '/status', { is_active: next });
      setMsg(next === 0 ? 'User deactivated' : 'User activated');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not update status');
    }
  };

  const remove = async (u) => {
    if (!window.confirm('Delete ' + u.name + '?')) return;
    try {
      await api.delete('/users/' + u.id);
      setMsg('User deleted');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not delete user');
    }
  };

  return (
    <div>
      <h1>Users</h1>
      {msg && <p className="info">{msg}</p>}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>City</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const self = u.id === user.id;
                const active = isActive(u);
                return (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td>{u.city}</td>
                    <td>
                      <select
                        value={u.role}
                        disabled={self}
                        onChange={(e) => changeRole(u, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={'badge ' + (active ? 'Active' : 'Deactivated')}>
                        {active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn small" disabled={self} onClick={() => changeStatus(u)}>
                          {active ? 'Deactivate' : 'Activate'}
                        </button>
                        {u.role !== 'admin' && (
                          <button className="btn small" onClick={() => remove(u)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
