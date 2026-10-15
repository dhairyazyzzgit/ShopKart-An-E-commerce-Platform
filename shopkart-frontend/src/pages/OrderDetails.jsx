import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { StatusBadge, StatusTracker } from '../components/OrderStatus';
import { formatDate, formatINR, getErrorMessage, onImgError } from '../utils/format';

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    orderAPI
      .getById(id)
      .then(({ data }) => active && setOrder(data.order))
      .catch((err) => active && setError(getErrorMessage(err, 'Failed to load order.')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <div className="state-box">Loading order...</div>;
  if (error) {
    return (
      <div className="state-box">
        <p className="text-danger">{error}</p>
        <Link to="/orders" className="btn btn-primary">Back to My Orders</Link>
      </div>
    );
  }

  const a = order.shippingAddress;

  return (
    <div className="page narrow">
      <Link to="/orders" className="link-btn">&larr; Back to My Orders</Link>

      <div className="card order-detail">
        <div className="order-head">
          <div>
            <h2>Order #{order._id.slice(-8)}</h2>
            <div className="muted small">Placed on {formatDate(order.createdAt)} · ID {order._id}</div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {order.paymentStatus === 'PAID' && <StatusTracker status={order.status} />}

        <h3>Items</h3>
        {order.items.map((item, i) => (
          <div key={`${item.product}-${i}`} className="detail-item">
            <img src={item.image} alt={item.name} className="cart-img" onError={onImgError} />
            <div className="cart-info">
              <strong>{item.name}</strong>
              <div className="muted small">{formatINR(item.price)} × {item.quantity}</div>
            </div>
            <div className="cart-line-total">{formatINR(item.price * item.quantity)}</div>
          </div>
        ))}

        <div className="summary-total">
          <span>Total</span>
          <span>{formatINR(order.totalAmount)}</span>
        </div>

        <div className="detail-cols">
          <div>
            <h3>Shipping to</h3>
            <p>{a.fullName}<br />{a.addressLine1}<br />{a.city}, {a.state} – {a.pincode}<br />📞 {a.phone}</p>
          </div>
          <div>
            <h3>Payment</h3>
            <p>
              Status: <strong>{order.paymentStatus}</strong>
              {order.razorpayPaymentId && <><br />Payment ID: {order.razorpayPaymentId}</>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
