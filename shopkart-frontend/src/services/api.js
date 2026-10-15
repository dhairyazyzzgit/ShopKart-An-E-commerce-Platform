import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true // sends the JWT cookie to protected endpoints
});

// If the session expires, tell the AuthContext so the UI logs the user out cleanly.
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthCall = url.includes('/customers/login') || url.includes('/customers/profile');
    if (err.response?.status === 401 && !isAuthCall) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

export const customerAPI = {
  register: (data) => API.post('/customers/register', data),
  login: (data) => API.post('/customers/login', data),
  logout: () => API.post('/customers/logout'),
  getProfile: () => API.get('/customers/profile')
};

export const productAPI = {
  getAll: (search = '', category = '', sort = '') => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category && category !== 'All') params.set('category', category);
    if (sort) params.set('sort', sort);
    return API.get(`/products?${params.toString()}`);
  },
  getById: (id) => API.get(`/products/${id}`)
};

export const wishlistAPI = {
  add: (productId) => API.post(`/wishlist/${productId}`),
  get: () => API.get('/wishlist'),
  remove: (productId) => API.delete(`/wishlist/${productId}`)
};

export const cartAPI = {
  get: () => API.get('/cart'),
  add: (productId) => API.post(`/cart/${productId}`),
  update: (productId, quantity) => API.patch(`/cart/${productId}`, { quantity }),
  remove: (productId) => API.delete(`/cart/${productId}`)
};

export const orderAPI = {
  createPaymentOrder: (shippingAddress) => API.post('/orders/create-payment-order', { shippingAddress }),
  verifyPayment: (paymentData) => API.post('/orders/verify-payment', paymentData),
  paymentFailed: (shopKartOrderId) => API.post('/orders/payment-failed', { shopKartOrderId }),
  getAll: () => API.get('/orders'),
  getById: (id) => API.get(`/orders/${id}`)
};

export default API;
