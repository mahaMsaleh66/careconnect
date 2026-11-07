import { useEffect, useState } from 'react';
import api from '../api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      setMsg('Could not load users');
    }
  };

  useEffect(() => {
    load();
  }, []);

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
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{u.city}</td>
                  <td>{u.role}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    {u.role !== 'admin' && (
                      <button className="btn small" onClick={() => remove(u)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}