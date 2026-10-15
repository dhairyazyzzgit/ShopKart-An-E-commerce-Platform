import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatINR, onImgError } from '../utils/format';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, cartLoading, cartTotal, updateQuantity, removeItem } = useCart();

  if (cartLoading) return <div className="state-box">Loading cart...</div>;

  if (cart.length === 0) {
    return (
      <div className="state-box">
        <h2>Your cart is empty</h2>
        <p className="muted">Add a few products and they'll show up here.</p>
        <Link to="/products" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  const hasProblem = cart.some((i) => !i.product || i.quantity > i.product.stock);

  return (
    <div className="page narrow">
      <h2>Shopping Cart</h2>
      <div className="card">
        {cart.map((item) => {
          const p = item.product;
          return (
            <div key={item._id} className="cart-row">
              {p ? (
                <img src={p.image} alt={p.name} className="cart-img" onError={onImgError} />
              ) : (
                <div className="cart-img cart-img-missing">?</div>
              )}

              <div className="cart-info">
                <strong>{p ? p.name : 'Product no longer available'}</strong>
                {p && <div className="muted small">{formatINR(p.price)} each</div>}
                {p && item.quantity > p.stock && (
                  <div className="text-danger small">Only {p.stock} left — reduce the quantity.</div>
                )}
              </div>

              {p && (
                <div className="qty">
                  <button className="qty-btn" onClick={() => updateQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Decrease quantity">−</button>
                  <span>{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= p.stock} aria-label="Increase quantity">+</button>
                </div>
              )}

              <div className="cart-line-total">{p ? formatINR(p.price * item.quantity) : '—'}</div>
              <button className="btn btn-danger btn-sm" onClick={() => removeItem(item.productId)}>Remove</button>
            </div>
          );
        })}

        <div className="cart-footer">
          <div className="summary-total">
            <span>Total</span>
            <span>{formatINR(cartTotal)}</span>
          </div>
          {hasProblem && <div className="alert alert-error">Fix the highlighted items before checking out.</div>}
          <button className="btn btn-primary btn-lg" disabled={hasProblem} onClick={() => navigate('/checkout')}>
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
