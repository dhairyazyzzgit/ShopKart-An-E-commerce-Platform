import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import NotFound from './pages/NotFound';

const guard = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<Navigate to="/products" replace />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetails />} />

                  <Route path="/wishlist" element={guard(<Wishlist />)} />
                  <Route path="/cart" element={guard(<Cart />)} />
                  <Route path="/checkout" element={guard(<Checkout />)} />
                  <Route path="/order-success/:id" element={guard(<OrderSuccess />)} />
                  <Route path="/orders" element={guard(<Orders />)} />
                  <Route path="/orders/:id" element={guard(<OrderDetails />)} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
               <Footer />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
