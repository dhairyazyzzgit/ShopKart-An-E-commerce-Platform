/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getErrorMessage } from '../utils/format';

// Global cart state. The server is the source of truth; this context mirrors it
// so the Navbar badge, Cart page and Checkout always agree.
//
// Item shape: { _id, productId, product: Product | null, quantity }
const CartContext = createContext(null);
const EMPTY = [];

export function CartProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  // State is tagged with the owning user so a previous user's cart can never leak
  // into the next session.
  const [store, setStore] = useState({ userId: null, items: EMPTY });
  const userId = user?._id ?? null;
  const cart = userId && store.userId === userId ? store.items : EMPTY;
  const cartLoading = Boolean(userId) && store.userId !== userId;

  const setCart = useCallback((items) => setStore({ userId, items }), [userId]);

  const refreshCart = useCallback(async () => {
    if (!userId) return [];
    const { data } = await cartAPI.get();
    setCart(data.cart);
    return data.cart;
  }, [userId, setCart]);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    cartAPI
      .get()
      .then(({ data }) => active && setStore({ userId, items: data.cart }))
      .catch(() => active && setStore({ userId, items: EMPTY }));
    return () => {
      active = false;
    };
  }, [userId]);

  const requireLogin = useCallback(() => {
    toast.info('Please log in to continue.');
    navigate('/login');
  }, [toast, navigate]);

  const addToCart = useCallback(
    async (product) => {
      if (!user) return requireLogin();
      try {
        const { data } = await cartAPI.add(product._id);
        setCart(data.cart);
        toast.success(`${product.name} added to cart`);
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    },
    [user, requireLogin, toast, setCart]
  );

  const updateQuantity = useCallback(
    async (productId, quantity) => {
      try {
        const { data } = await cartAPI.update(productId, quantity);
        setCart(data.cart);
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    },
    [toast, setCart]
  );

  const removeItem = useCallback(
    async (productId) => {
      try {
        const { data } = await cartAPI.remove(productId);
        setCart(data.cart);
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    },
    [toast, setCart]
  );

  // Called after a VERIFIED payment: backend already emptied the cart, mirror it here.
  const clearCartState = useCallback(() => setCart(EMPTY), [setCart]);

  const cartCount = useMemo(() => cart.reduce((n, i) => n + i.quantity, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + (i.product ? i.product.price * i.quantity : 0), 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      cartLoading,
      cartCount,
      cartTotal,
      refreshCart,
      addToCart,
      updateQuantity,
      removeItem,
      clearCartState
    }),
    [cart, cartLoading, cartCount, cartTotal, refreshCart, addToCart, updateQuantity, removeItem, clearCartState]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
