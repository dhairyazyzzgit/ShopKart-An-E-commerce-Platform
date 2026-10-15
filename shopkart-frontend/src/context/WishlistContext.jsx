/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wishlistAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getErrorMessage } from '../utils/format';

const WishlistContext = createContext(null);
const EMPTY = [];

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [store, setStore] = useState({ userId: null, items: EMPTY });
  const userId = user?._id ?? null;
  const items = userId && store.userId === userId ? store.items : EMPTY;
  const wishlistLoading = Boolean(userId) && store.userId !== userId;
  const setItems = useCallback((list) => setStore({ userId, items: list }), [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    wishlistAPI
      .get()
      .then(({ data }) => active && setStore({ userId, items: data.wishlist || EMPTY }))
      .catch(() => active && setStore({ userId, items: EMPTY }));
    return () => {
      active = false;
    };
  }, [userId]);

  const ids = useMemo(() => new Set(items.map((p) => p._id)), [items]);
  const isWishlisted = useCallback((id) => ids.has(id), [ids]);

  const toggleWishlist = useCallback(
    async (product) => {
      if (!user) {
        toast.info('Please log in to use your wishlist.');
        return navigate('/login');
      }
      try {
        const { data } = ids.has(product._id)
          ? await wishlistAPI.remove(product._id)
          : await wishlistAPI.add(product._id);
        setItems(data.wishlist || []);
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    },
    [user, ids, toast, navigate, setItems]
  );

  const value = useMemo(
    () => ({ items, wishlistLoading, isWishlisted, toggleWishlist }),
    [items, wishlistLoading, isWishlisted, toggleWishlist]
  );
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
