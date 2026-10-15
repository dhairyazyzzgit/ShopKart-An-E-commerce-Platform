import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="brand brand-dark">🛒 ShopKart</div>
          <p className="muted small">Your one-stop shop for electronics, fashion and books.</p>
        </div>
        <div className="footer-links">
          <Link to="/products">Products</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/cart">Cart</Link>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} ShopKart · Payments run in Razorpay Test Mode</div>
    </footer>
  );
}