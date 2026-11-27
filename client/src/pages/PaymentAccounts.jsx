import { useEffect, useState } from 'react';
import api from '../api';

const METHODS = ['JazzCash', 'Easypaisa', 'Bank'];
const emptyForm = {
  method: 'JazzCash',
  account_title: '',
  account_number: '',
  bank_name: '',
  instructions: '',
  is_active: 1,
};

export default function PaymentAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/payment-accounts');
      setAccounts(res.data);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not load accounts');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const change = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'is_active' ? Number(value) : value });
  };

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put('/payment-accounts/' + editingId, form);
        setMsg('Account updated');
      } else {
        await api.post('/payment-accounts', form);
        setMsg('Account saved');
      }
      reset();
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not save account');
    }
  };

  const startEdit = (a) => {
    setEditingId(a.id);
    setForm({
      method: a.method,
      account_title: a.account_title || '',
      account_number: a.account_number || '',
      bank_name: a.bank_name || '',
      instructions: a.instructions || '',
      is_active: Number(a.is_active) !== 0 ? 1 : 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggle = async (a) => {
    const next = Number(a.is_active) !== 0 ? 0 : 1;
    try {
      await api.put('/payment-accounts/' + a.id, { is_active: next });
      setMsg(next ? 'Account activated' : 'Account hidden from donors');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not update status');
    }
  };

  const remove = async (a) => {
    if (!window.confirm('Delete ' + a.method + ' account ' + a.account_number + '?')) return;
    try {
      await api.delete('/payment-accounts/' + a.id);
      if (editingId === a.id) reset();
      setMsg('Account deleted');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not delete account');
    }
  };

  return (
    <div>
      <h1>Receiving accounts</h1>
      <p>JazzCash, Easypaisa and bank details shown to donors on the Donations page.</p>
      {msg && <p className="info">{msg}</p>}

      <div className="card">
        <h3>{editingId ? 'Edit account' : 'Add account'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <select name="method" value={form.method} onChange={change}>
              {METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <input name="account_title" placeholder="Account title / name" value={form.account_title} onChange={change} required />
            <input name="account_number" placeholder="Account / wallet number" value={form.account_number} onChange={change} required />
            <input
              name="bank_name"
              placeholder={form.method === 'Bank' ? 'Bank name (HBL, Meezan, UBL…)' : 'Wallet note (optional)'}
              value={form.bank_name}
              onChange={change}
            />
          </div>
          <input
            name="instructions"
            maxLength={255}
            placeholder="Instructions for donors (optional)"
            value={form.instructions}
            onChange={change}
          />
          <select name="is_active" value={form.is_active} onChange={change} style={{ maxWidth: 220, marginBottom: 12 }}>
            <option value={1}>Active (visible to donors)</option>
            <option value={0}>Inactive (hidden)</option>
          </select>
          <div className="row-actions">
            <button type="submit" className="btn">{editingId ? 'Update account' : 'Save account'}</button>
            {editingId && (
              <button type="button" className="btn" onClick={reset}>Cancel</button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h3>All accounts</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Title</th>
                <th>Number</th>
                <th>Bank / note</th>
                <th>Instructions</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 && (
                <tr><td colSpan="7">No accounts yet</td></tr>
              )}
              {accounts.map((a) => {
                const active = Number(a.is_active) !== 0;
                return (
                  <tr key={a.id}>
                    <td>{a.method}</td>
                    <td>{a.account_title}</td>
                    <td>{a.account_number}</td>
                    <td>{a.bank_name || '—'}</td>
                    <td>{a.instructions || '—'}</td>
                    <td>
                      <span className={'badge ' + (active ? 'Active' : 'Deactivated')}>
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn small" onClick={() => startEdit(a)}>Edit</button>
                        <button className="btn small" onClick={() => toggle(a)}>
                          {active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="btn small" onClick={() => remove(a)}>Delete</button>
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
