import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatINR, onImgError } from '../utils/format';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wished = isWishlisted(product._id);
  const soldOut = product.stock < 1;
  const lowStock = !soldOut && product.stock <= 5;

  return (
    <div className="card product-card">
      <button
        type="button"
        className={`heart ${wished ? 'active' : ''}`}
        onClick={() => toggleWishlist(product)}
        title={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {wished ? '♥' : '♡'}
      </button>

      {(soldOut || lowStock) && (
        <span className={`ribbon ${soldOut ? 'ribbon-out' : ''}`}>
          {soldOut ? 'Out of stock' : `Only ${product.stock} left`}
        </span>
      )}

      <Link to={`/products/${product._id}`} className="product-link">
        <div className="product-media">
          <img src={product.image} alt={product.name} className="product-img" onError={onImgError} loading="lazy" />
        </div>
        <span className="chip">{product.category}</span>
        <h3 className="product-title">{product.name}</h3>
      </Link>

      <div className="product-footer">
        <div className="price">{formatINR(product.price)}</div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={soldOut}
          onClick={() => addToCart(product)}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}