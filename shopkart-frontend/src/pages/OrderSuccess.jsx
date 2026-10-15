import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { formatINR, getErrorMessage } from '../utils/format';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    orderAPI
      .getById(id)
      .then(({ data }) => active && setOrder(data.order))
      .catch((err) => active && setError(getErrorMessage(err, 'Failed to load order details.')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <div className="state-box">Loading details...</div>;
  if (error) {
    return (
      <div className="state-box">
        <p className="text-danger">{error}</p>
        <Link to="/orders" className="btn btn-primary">View My Orders</Link>
      </div>
    );
  }

  const paid = order.paymentStatus === 'PAID';

  return (
    <div className="page narrow">
      <div className="card success-card">
        <h1 className={paid ? 'text-success' : 'text-danger'}>
          {paid ? '✅ Order Placed Successfully' : '⚠️ Payment not completed'}
        </h1>
        <p className="muted">
          {paid ? 'Your order has been saved successfully. Thank you for shopping with ShopKart!' : 'This order has not been paid yet.'}
        </p>

        <div className="success-details">
          <p><strong>Order ID:</strong> {order._id}</p>
          <p><strong>Total:</strong> {formatINR(order.totalAmount)}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Payment:</strong> {order.paymentStatus}</p>
          {order.razorpayPaymentId && <p><strong>Payment ID:</strong> {order.razorpayPaymentId}</p>}
        </div>

        <div className="row gap center-row">
          <Link to="/orders" className="btn btn-primary">View My Orders</Link>
          <Link to="/products" className="btn btn-outline">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
