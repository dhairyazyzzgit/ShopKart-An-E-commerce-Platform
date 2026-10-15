import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CheckoutForm from '../components/CheckoutForm';
import OrderSummary from '../components/OrderSummary';
import { getErrorMessage } from '../utils/format';
import { EMPTY_SHIPPING, trimShipping, validateShipping } from '../utils/validators';

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = RAZORPAY_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, cartTotal, refreshCart, clearCartState } = useCart();

  // Checkout form state lives here and is passed down to <CheckoutForm />
  const [form, setForm] = useState({
    ...EMPTY_SHIPPING,
    fullName: user?.fullName || user?.name || '',
    phone: user?.phone || ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loadingCart, setLoadingCart] = useState(true);
  const [stage, setStage] = useState('idle'); // idle | creating | paying | verifying

  const inFlight = useRef(false); // blocks double submits
  const verifying = useRef(false);
  const completed = useRef(false); // set once payment is verified so the empty-cart redirect doesn't fire

  // Re-fetch the cart so the review reflects the latest server prices/stock
  useEffect(() => {
    let active = true;
    refreshCart()
      .catch((err) => active && setError(getErrorMessage(err, 'Failed to load cart')))
      .finally(() => active && setLoadingCart(false));
    return () => {
      active = false;
    };
  }, [refreshCart]);

  // Empty cart + direct visit to /checkout → back to the cart
  useEffect(() => {
    if (!loadingCart && cart.length === 0 && !completed.current) {
      navigate('/cart', { replace: true });
    }
  }, [loadingCart, cart.length, navigate]);

  const release = () => {
    inFlight.current = false;
    verifying.current = false;
    setStage('idle');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const openRazorpay = (data, shipping) => {
    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: 'ShopKart',
      description: 'ShopKart Order',
      order_id: data.razorpayOrderId,

      // The handler does NOT mean "paid". It only hands the payment details to
      // our backend, which verifies the signature before anything is confirmed.
      handler: async (response) => {
        verifying.current = true;
        setStage('verifying');
        try {
          await orderAPI.verifyPayment({
            shopKartOrderId: data.shopKartOrderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          completed.current = true;
          clearCartState(); // backend cart is already empty → sync global state (Navbar → Cart (0))
          navigate(`/order-success/${data.shopKartOrderId}`, { replace: true });
        } catch (err) {
          setError(`${getErrorMessage(err, 'Payment verification failed.')} Your cart has not been cleared.`);
          release();
          refreshCart().catch(() => {});
        }
      },

      prefill: { name: shipping.fullName, contact: shipping.phone, email: user?.email },
      theme: { color: '#4f46e5' },
      modal: {
        // User closed the popup without paying
        ondismiss: () => {
          if (!verifying.current && !completed.current) {
            setError('Payment was cancelled. Your cart has not been cleared.');
            release();
          }
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (res) => {
      setError(`Payment failed${res?.error?.description ? `: ${res.error.description}` : '.'} Your cart has not been cleared. Please try again.`);
      orderAPI.paymentFailed(data.shopKartOrderId).catch(() => {});
    });
    rzp.open();
    setStage('paying');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (inFlight.current) return;
    setError('');

    // Client-side validation first — no network call if this fails
    const errors = validateShipping(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    inFlight.current = true;
    setStage('creating');

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Could not load Razorpay. Check your internet connection and try again.');

      const shipping = trimShipping(form);
      const { data } = await orderAPI.createPaymentOrder(shipping); // only the address is sent
      openRazorpay(data, shipping);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to start checkout.'));
      release();
      refreshCart().catch(() => {}); // stock/price may have changed
    }
  };

  if (loadingCart) return <div className="state-box">Loading Checkout...</div>;
  if (cart.length === 0) return null; // redirecting

  const hasProblem = cart.some((i) => !i.product || i.quantity > i.product.stock);
  const busyLabel = { creating: 'Creating order…', paying: 'Waiting for payment…', verifying: 'Verifying payment…' }[stage];

  return (
    <div className="page narrow">
      <h2>Checkout</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {hasProblem && (
        <div className="alert alert-error">
          Some items are unavailable or exceed stock. Please update your cart before paying.
        </div>
      )}

      <div className="checkout-grid">
        <CheckoutForm
          values={form}
          errors={fieldErrors}
          onChange={handleChange}
          onSubmit={handlePlaceOrder}
          busy={stage !== 'idle'}
          busyLabel={busyLabel}
          disabled={hasProblem}
        />
        <OrderSummary items={cart} total={cartTotal} />
      </div>
    </div>
  );
}
