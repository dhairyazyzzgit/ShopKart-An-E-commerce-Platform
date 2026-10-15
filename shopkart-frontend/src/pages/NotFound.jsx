import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="state-box">
      <h2>404 — Page not found</h2>
      <Link to="/products" className="btn btn-primary">Back to Products</Link>
    </div>
  );
}
