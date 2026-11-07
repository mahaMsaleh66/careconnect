import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Donations() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [crises, setCrises] = useState([]);
  const [form, setForm] = useState({ amount: '', category: 'General', crisis_id: '' });
  const [msg, setMsg] = useState('');
  const [receipt, setReceipt] = useState(null);

  const isAdmin = user.role === 'admin';

  const load = async () => {
    try {
      const url = isAdmin ? '/donations' : '/donations/my';
      const res = await api.get(url);
      setDonations(res.data);
    } catch (err) {
      setMsg('Could not load donations');
    }
  };

  useEffect(() => {
    load();
    if (!isAdmin) {
      api.get('/crises').then((res) => {
        setCrises(res.data.filter((c) => c.status === 'Active'));
      });
    }
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/donations', form);
      setForm({ amount: '', category: 'General', crisis_id: '' });
      setMsg('Thank you! Donation recorded.');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Donation failed');
    }
  };

  const total = donations.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div>
      <h1>Donations</h1>
      {msg && <p className="info no-print">{msg}</p>}

      {user.role === 'donor' && (
        <div className="card no-print">
          <h3>Make a Donation</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input name="amount" type="number" placeholder="Amount (PKR)" value={form.amount} onChange={change} required />
              <select name="category" value={form.category} onChange={change}>
                <option>General</option>
                <option>Food</option>
                <option>Medical</option>
                <option>Education</option>
                <option>Shelter</option>
              </select>
              <select name="crisis_id" value={form.crisis_id} onChange={change}>
                <option value="">No specific crisis</option>
                {crises.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn">Donate</button>
          </form>
          <p><small>Note: this is a record only. No real payment is processed.</small></p>
        </div>
      )}

      <div className="card no-print">
        <h3>{isAdmin ? 'All Donations' : 'My Donations'}</h3>
        <p>Total: <b>PKR {total.toLocaleString()}</b></p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Receipt</th>
                {isAdmin && <th>Donor</th>}
                <th>Amount</th>
                <th>Category</th>
                <th>Crisis</th>
                <th>Date</th>
                {!isAdmin && <th>View</th>}
              </tr>
            </thead>
            <tbody>
              {donations.length === 0 && (
                <tr><td colSpan="7">No donations yet</td></tr>
              )}
              {donations.map((d) => (
                <tr key={d.id}>
                  <td>{d.receipt_no}</td>
                  {isAdmin && <td>{d.donor_name}</td>}
                  <td>{Number(d.amount).toLocaleString()}</td>
                  <td>{d.category}</td>
                  <td>{d.crisis_title || '-'}</td>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                  {!isAdmin && (
                    <td>
                      <button className="btn small" onClick={() => setReceipt(d)}>Receipt</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {receipt && (
        <div className="card receipt">
          <h2>CareConnect - Donation Receipt</h2>
          <p><b>Receipt No:</b> {receipt.receipt_no}</p>
          <p><b>Donor:</b> {user.name}</p>
          <p><b>Amount:</b> PKR {Number(receipt.amount).toLocaleString()}</p>
          <p><b>Category:</b> {receipt.category}</p>
          <p><b>Crisis:</b> {receipt.crisis_title || 'General fund'}</p>
          <p><b>Date:</b> {new Date(receipt.created_at).toLocaleString()}</p>
          <p>Thank you for your generosity.</p>
          <button className="btn no-print" onClick={() => window.print()}>Print Receipt</button>
          <button className="btn no-print" style={{ marginLeft: 8 }} onClick={() => setReceipt(null)}>Close</button>
        </div>
      )}
    </div>
  );
}