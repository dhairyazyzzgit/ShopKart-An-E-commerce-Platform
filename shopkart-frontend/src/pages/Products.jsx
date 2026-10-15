import { useEffect, useState } from 'react';
import { productAPI } from '../services/api';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import { getErrorMessage } from '../utils/format';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await productAPI.getAll(search, category, sort);
        if (active) setProducts(res.data.products);
      } catch (err) {
        if (active) setError(getErrorMessage(err, 'Something went wrong while loading products.'));
      } finally {
        if (active) setLoading(false);
      }
    }, 300); // debounce typing
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, category, sort]);

  return (
    <div className="page">
            <section className="hero">
        <span className="hero-tag">✨ New season deals</span>
        <h1>Shop smarter,<br />live better.</h1>
        <p>Electronics, fashion and books — delivered to your door.</p>
      </section>

      <div className="pills">
        {['All', 'Electronics', 'Fashion', 'Books'].map((c) => (
          <button key={c} className={`pill ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>
      <SearchBar search={search} setSearch={setSearch} category={category} setCategory={setCategory} sort={sort} setSort={setSort} />

      {loading && <div className="state-box">Loading products...</div>}
      {error && <div className="state-box text-danger">{error}</div>}
      {!loading && !error && products.length === 0 && <div className="state-box">No products found.</div>}

      {!loading && !error && products.length > 0 && (
        <div className="grid">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
}
