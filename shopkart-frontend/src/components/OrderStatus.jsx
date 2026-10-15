const STEPS = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

const LABELS = {
  PENDING_PAYMENT: 'Pending payment',
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered'
};

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

// Visual progress through PLACED → CONFIRMED → SHIPPED → DELIVERED
export function StatusTracker({ status }) {
  const current = STEPS.indexOf(status);
  return (
    <ol className="tracker" aria-label="Order progress">
      {STEPS.map((step, i) => (
        <li key={step} className={i <= current ? 'done' : ''}>
          <span className="dot">{i <= current ? '✓' : i + 1}</span>
          <span className="tracker-label">{LABELS[step]}</span>
        </li>
      ))}
    </ol>
  );
}
