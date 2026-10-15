import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link to="/products" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">🛒</span> ShopKart
        </Link>

        <nav className={`nav-links ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          <NavLink to="/products">Products</NavLink>
          {user && <NavLink to="/wishlist">❤️ Wishlist</NavLink>}
          {user && <NavLink to="/orders">My Orders</NavLink>}
          <span className="nav-spacer" />
          {user ? (
            <>
              <span className="nav-user">Hi, {user.fullName || user.name || 'Customer'}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
        </nav>

        <NavLink to="/cart" className="cart-link" onClick={() => setOpen(false)}>
          🛍️ Cart ({user ? cartCount : 0})
        </NavLink>

        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>
    </header>
  );
}