export default function ReliefTransparency({ data }) {
  if (!data) return null;

  const categories = data.by_category || [];
  const maxAmount = Math.max(1, ...categories.map((row) => Number(row.amount) || 0));

  return (
    <div className="card transparency-card">
      <h3>Relief Impact Summary</h3>
      <p className="card-hint">
        Recorded gifts and how help is moving in CareConnect. This is an operations snapshot,
        not a live bank statement.
      </p>
      <div className="transparency-stats">
        <div>
          <span>Recorded donations</span>
          <strong>PKR {Number(data.total_amount || 0).toLocaleString()}</strong>
          <em>{data.donation_count || 0} gifts</em>
        </div>
        <div>
          <span>Help requests</span>
          <strong>{data.requests?.open || 0} open</strong>
          <em>{data.requests?.resolved || 0} resolved</em>
        </div>
        <div>
          <span>Volunteer tasks</span>
          <strong>{data.tasks?.active || 0} active</strong>
          <em>{data.tasks?.done || 0} completed</em>
        </div>
      </div>
      {categories.length > 0 && (
        <div className="transparency-cats">
          {categories.map((row) => (
            <div className="transparency-cat" key={row.category}>
              <div className="transparency-cat-row">
                <span>{row.category}</span>
                <b>PKR {Number(row.amount || 0).toLocaleString()}</b>
              </div>
              <div className="transparency-bar">
                <div style={{ width: Math.max(8, (Number(row.amount) / maxAmount) * 100) + '%' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
