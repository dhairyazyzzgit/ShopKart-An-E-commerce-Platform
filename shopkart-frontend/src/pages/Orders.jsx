import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import OrderCard from '../components/OrderCard';
import { getErrorMessage } from '../utils/format';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    orderAPI
      .getAll()
      .then(({ data }) => active && setOrders(data.orders || []))
      .catch((err) => active && setError(getErrorMessage(err, 'Failed to fetch orders.')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const retry = () => {
    setError('');
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  if (loading) return <div className="state-box">Loading Orders...</div>;

  if (error) {
    return (
      <div className="state-box">
        <p className="text-danger">{error}</p>
        <button className="btn btn-primary" onClick={retry}>Try again</button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="state-box">
        <h2>You have not placed any orders yet.</h2>
        <Link to="/products" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <h2>My Orders</h2>
      <div className="stack">
        {orders.map((order) => <OrderCard key={order._id} order={order} />)}
      </div>
    </div>
  );
}
