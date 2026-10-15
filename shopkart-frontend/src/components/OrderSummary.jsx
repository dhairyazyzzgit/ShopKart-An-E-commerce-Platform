import { formatINR } from '../utils/format';

// Final cart review shown on the checkout page.
// Prices here are for display only — the server recalculates the real total.
export default function OrderSummary({ items, total }) {
  return (
    <aside className="card summary">
      <h3>Order Summary</h3>
      <div className="summary-lines">
        {items.map((item) => {
          const p = item.product;
          const short = p && item.quantity > p.stock;
          return (
            <div key={item._id} className="summary-line">
              <div>
                <span>{p ? p.name : 'Unavailable product'} × {item.quantity}</span>
                {!p && <div className="text-danger small">No longer available — remove it from your cart.</div>}
                {short && <div className="text-danger small">Only {p.stock} left in stock.</div>}
              </div>
              <span>{p ? formatINR(p.price * item.quantity) : '—'}</span>
            </div>
          );
        })}
      </div>
      <div className="summary-total">
        <span>Total</span>
        <span>{formatINR(total)}</span>
      </div>
    </aside>
  );
}
