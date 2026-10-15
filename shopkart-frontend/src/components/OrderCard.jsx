import { Link } from 'react-router-dom';
import { StatusBadge } from './OrderStatus';
import { formatDate, formatINR, shortId } from '../utils/format';

export default function OrderCard({ order }) {
  return (
    <div className="card order-card">
      <div className="order-head">
        <div>
          <strong>Order #{shortId(order._id)}</strong>
          <div className="muted small">{formatDate(order.createdAt)}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="order-items">
        {order.items.map((item, i) => (
          <div key={`${item.product}-${i}`} className="summary-line">
            <span>{item.name} × {item.quantity}</span>
            <span>{formatINR(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="order-foot">
        <strong>Total: {formatINR(order.totalAmount)}</strong>
        <Link to={`/orders/${order._id}`} className="btn btn-outline btn-sm">View Details</Link>
      </div>
    </div>
  );
}
