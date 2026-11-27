import { useEffect, useState } from 'react';
import api, { assetUrl } from '../api';
import { useAuth } from '../AuthContext';
import { useLiveReload } from '../SocketContext';
import ReliefTransparency from '../components/ReliefTransparency';

const emptyForm = { amount: '', category: 'General', crisis_id: '', note: '' };

function copyText(value) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(value);
  }
  const el = document.createElement('textarea');
  el.value = value;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  return Promise.resolve();
}

function ReceivingAccounts({ accounts }) {
  const [copied, setCopied] = useState('');

  const copy = async (id, number) => {
    try {
      await copyText(number);
      setCopied(id);
      setTimeout(() => setCopied(''), 1600);
    } catch (err) {
      setCopied('');
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="card no-print">
        <h3>1. Copy an official account</h3>
        <p>An administrator has not published JazzCash, Easypaisa or bank details yet. You can still record a donation and upload a transfer screenshot.</p>
      </div>
    );
  }

  return (
    <div className="card no-print">
      <h3>1. Copy an official account</h3>
      <p>Copy an active JazzCash, Easypaisa or bank number, then transfer the amount from your own wallet or bank app.</p>
      <div className="pay-grid">
        {accounts.map((a) => (
          <div className={'pay-card method-' + a.method.replace(/\s/g, '')} key={a.id}>
            <div className="pay-method">{a.method}</div>
            <div className="pay-title">{a.account_title}</div>
            {a.bank_name && <div className="pay-bank">{a.bank_name}</div>}
            <div className="pay-number">{a.account_number}</div>
            {a.instructions && <p className="pay-hint">{a.instructions}</p>}
            <button type="button" className="btn small" onClick={() => copy(a.id, a.account_number)}>
              {copied === a.id ? 'Copied' : 'Copy number'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const label = status || 'Pending';
  return <span className={'badge ' + label}>{label}</span>;
}

export default function Donations() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [crises, setCrises] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [receiptFile, setReceiptFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [transparency, setTransparency] = useState(null);

  const isAdmin = user.role === 'admin';
  const colSpan = isAdmin ? 10 : 8;

  const load = async () => {
    try {
      const url = isAdmin ? '/donations' : '/donations/my';
      const res = await api.get(url);
      setDonations(res.data);
      try {
        const impact = await api.get('/dashboard/transparency');
        setTransparency(impact.data);
      } catch (err) {
        setTransparency(null);
      }
      if (!isAdmin) {
        const crisisRes = await api.get('/crises');
        setCrises(crisisRes.data.filter((c) => c.status === 'Active'));
      }
    } catch (err) {
      setMsg('Could not load donations');
    }
  };

  useLiveReload(['donation:created', 'donation:updated', 'crisis:updated'], load);

  useEffect(() => {
    load();
    if (!isAdmin) {
      api.get('/crises').then((res) => {
        setCrises(res.data.filter((c) => c.status === 'Active'));
      }).catch(() => {});
      api.get('/payment-accounts').then((res) => setAccounts(res.data)).catch(() => {});
    }
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receiptFile) {
      setMsg('Upload a JPG, PNG or WEBP screenshot of your payment (max 5MB).');
      return;
    }
    try {
      const data = new FormData();
      data.append('amount', form.amount);
      data.append('category', form.category);
      if (form.crisis_id) data.append('crisis_id', form.crisis_id);
      if (form.note) data.append('note', form.note);
      data.append('receipt', receiptFile);
      const res = await api.post('/donations', data);
      setForm(emptyForm);
      setReceiptFile(null);
      e.target.reset();
      setMsg('Thank you. Donation recorded as Pending. Receipt ' + res.data.receipt_no);
      if (res.data.donation) setReceipt(res.data.donation);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Donation failed');
    }
  };

  const setStatus = async (id, status) => {
    setBusyId(id);
    try {
      await api.put('/donations/' + id + '/status', { status });
      setMsg('Donation marked ' + status);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not update status');
    } finally {
      setBusyId(null);
    }
  };

  const total = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  const byCategory = Object.values(
    donations.reduce((acc, d) => {
      const key = d.category || 'General';
      if (!acc[key]) acc[key] = { category: key, amount: 0 };
      acc[key].amount += Number(d.amount) || 0;
      return acc;
    }, {})
  );
  const impact = transparency || {
    total_amount: total,
    donation_count: donations.length,
    by_category: byCategory,
    requests: { open: 0, resolved: 0 },
    tasks: { active: 0, done: 0 },
  };
  const donorName = receipt && (receipt.donor_name || user.name);
  const donorEmail = receipt && (receipt.donor_email || user.email || '—');

  return (
    <div>
      <h1 className="no-print">Donations</h1>
      {msg && <p className="info no-print">{msg}</p>}

      <div className="no-print">
        <ReliefTransparency data={impact} />
      </div>

      {user.role === 'donor' && (
        <div className="card no-print">
          <h3>How to donate</h3>
          <ol className="donate-steps">
            <li>Copy an active JazzCash, Easypaisa or bank account below.</li>
            <li>Transfer the amount from your own wallet or bank app. Keep the payment screenshot.</li>
            <li>Enter the amount and reference, upload that screenshot, and wait for an admin to mark it Verified or Rejected.</li>
          </ol>
        </div>
      )}

      {user.role === 'donor' && <ReceivingAccounts accounts={accounts} />}

      {user.role === 'donor' && (
        <div className="card no-print">
          <h3>3. Record amount and upload screenshot</h3>
          <p className="donate-step-note">Step 2 happens in JazzCash, Easypaisa or your bank app. Then come back here.</p>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input name="amount" type="number" min="1" step="1" placeholder="Amount (PKR)" value={form.amount} onChange={change} required />
              <select name="category" value={form.category} onChange={change}>
                <option>General</option>
                <option>Food</option>
                <option>Medical</option>
                <option>Education</option>
                <option>Shelter</option>
              </select>
              <select name="crisis_id" value={form.crisis_id} onChange={change}>
                <option value="">General Relief Fund</option>
                {crises.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <input
              name="note"
              maxLength={255}
              placeholder="Note / Reference — JazzCash TID, Easypaisa ID, or bank slip no."
              value={form.note}
              onChange={change}
            />
            <label className="file-label">
              Payment receipt screenshot (JPG, PNG or WEBP, max 5MB)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={(e) => setReceiptFile(e.target.files[0] || null)}
              />
            </label>
            <button type="submit" className="btn">Submit for verification</button>
          </form>
          <p><small>CareConnect does not charge a live gateway here. An administrator checks your screenshot, then marks the gift Verified or Rejected.</small></p>
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
                <th>Note</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {donations.length === 0 && (
                <tr><td colSpan={colSpan}>No donations yet</td></tr>
              )}
              {donations.map((d) => (
                <tr key={d.id}>
                  <td>{d.receipt_no}</td>
                  {isAdmin && <td>{d.donor_name}</td>}
                  <td>{Number(d.amount).toLocaleString()}</td>
                  <td>{d.category}</td>
                  <td>{d.crisis_title || 'General Relief Fund'}</td>
                  <td>{d.note || '—'}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn small" onClick={() => setReceipt(d)}>Receipt</button>
                      {d.receipt_image && (
                        <button type="button" className="btn small secondary" onClick={() => setScreenshot(d)}>
                          View Screenshot
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            className="btn small"
                            disabled={busyId === d.id || d.status === 'Verified'}
                            onClick={() => setStatus(d.id, 'Verified')}
                          >
                            Verify
                          </button>
                          <button
                            type="button"
                            className="btn small danger"
                            disabled={busyId === d.id || d.status === 'Rejected'}
                            onClick={() => setStatus(d.id, 'Rejected')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {screenshot && (
        <div className="shot-modal no-print" onClick={() => setScreenshot(null)}>
          <div className="shot-sheet" onClick={(e) => e.stopPropagation()}>
            <h3>Payment screenshot</h3>
            <p>{screenshot.receipt_no} · PKR {Number(screenshot.amount).toLocaleString()}</p>
            <img src={assetUrl(screenshot.receipt_image)} alt={'Payment screenshot for ' + screenshot.receipt_no} />
            <div className="receipt-actions">
              <a className="btn small secondary" href={assetUrl(screenshot.receipt_image)} target="_blank" rel="noreferrer">Open original</a>
              <button type="button" className="btn small" onClick={() => setScreenshot(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div className="receipt-print">
          <div className="receipt-sheet">
            <div className="receipt-brand">
              <div className="receipt-mark">CC</div>
              <div>
                <h2>CareConnect</h2>
                <p>Official Donation Receipt</p>
              </div>
            </div>
            <p className="receipt-org">AI-Powered Social Welfare Management System · University of Sindh, Jamshoro</p>

            <dl className="receipt-meta">
              <div>
                <dt>Receipt No.</dt>
                <dd>{receipt.receipt_no}</dd>
              </div>
              <div>
                <dt>Date &amp; Time</dt>
                <dd>{new Date(receipt.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Donor</dt>
                <dd>{donorName}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{donorEmail}</dd>
              </div>
              <div>
                <dt>Target</dt>
                <dd>{receipt.crisis_title || 'General Relief Fund'}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{receipt.category}</dd>
              </div>
              <div>
                <dt>Verification</dt>
                <dd>{receipt.status || 'Pending'}</dd>
              </div>
            </dl>

            <div className="receipt-amount">
              <span>Amount received</span>
              <strong>PKR {Number(receipt.amount).toLocaleString()}</strong>
            </div>

            {receipt.note && (
              <p className="receipt-note"><b>Note / Reference:</b> {receipt.note}</p>
            )}

            <p className="receipt-thanks">Thank you for supporting relief and welfare work through CareConnect.</p>
            <p className="receipt-verify">
              This is a system-generated receipt. Status is {receipt.status || 'Pending'} until an administrator
              checks the payment screenshot. Quote receipt number {receipt.receipt_no} in any follow-up.
            </p>

            <div className="receipt-stamp">{(receipt.status || 'Pending') + ' · CareConnect FYP'}</div>

            <div className="receipt-actions no-print">
              <button className="btn" onClick={() => window.print()}>Print Receipt</button>
              <button className="btn" onClick={() => setReceipt(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
