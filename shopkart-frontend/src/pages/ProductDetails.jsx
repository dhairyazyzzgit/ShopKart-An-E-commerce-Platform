import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatINR, getErrorMessage, onImgError } from '../utils/format';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    productAPI
      .getById(id)
      .then((res) => active && setProduct(res.data.product))
      .catch((err) => active && setError(getErrorMessage(err, 'Failed to fetch product details.')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <div className="state-box">Loading product details...</div>;
  if (error) return <div className="state-box text-danger">{error}</div>;

  const soldOut = product.stock < 1;
  const wished = isWishlisted(product._id);

  return (
    <div className="page narrow">
      <button className="link-btn" onClick={() => navigate('/products')}>&larr; Back to Products</button>
      <div className="detail-layout">
        <img src={product.image} alt={product.name} className="detail-img" onError={onImgError} />
        <div className="detail-info">
          <span className="chip">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="muted">{product.description}</p>
          <p className="price price-lg">{formatINR(product.price)}</p>
          <p className={soldOut ? 'text-danger' : 'muted'}>{soldOut ? 'Out of stock' : `In Stock: ${product.stock} units`}</p>
          <div className="row gap">
            <button className="btn btn-primary btn-lg" disabled={soldOut} onClick={() => addToCart(product)}>Add to Cart</button>
            <button className="btn btn-outline btn-lg" onClick={() => toggleWishlist(product)}>
              {wished ? '♥ In Wishlist' : '♡ Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
