import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';

export default function Wishlist() {
  const { items, wishlistLoading } = useWishlist();

  if (wishlistLoading) return <div className="state-box">Loading Wishlist...</div>;

  return (
    <div className="page">
      <h2>My Wishlist</h2>
      {items.length === 0 ? (
        <div className="state-box">
          <p>No products saved in your wishlist yet.</p>
          <Link to="/products" className="btn btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid">
          {items.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
}
