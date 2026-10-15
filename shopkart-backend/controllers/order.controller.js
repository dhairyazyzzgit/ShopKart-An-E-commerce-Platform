import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from '../models/order.model.js';
import Customer from '../models/customer.model.js';
import Product from '../models/product.model.js';
import razorpayInstance from '../config/razorpay.js';
import { validateShippingAddress } from '../utils/validateShipping.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Order of the fulfilment pipeline (used by the bonus status endpoint)
const STATUS_FLOW = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

// ---------------------------------------------------------------------------
// 1. POST /orders/create-payment-order
//    Validates cart + stock, calculates the total on the server, saves a
//    PENDING_PAYMENT order snapshot and creates the Razorpay order.
//    The cart is NOT touched here.
// ---------------------------------------------------------------------------
export const createPaymentOrder = async (req, res) => {
  try {
    // Only the shipping address is read from the body. Any totalAmount /
    // items / prices sent by the client are deliberately ignored.
    const { valid, errors, clean } = validateShippingAddress(req.body?.shippingAddress);
    if (!valid) {
      return res.status(400).json({
        success: false,
        message: Object.values(errors)[0],
        errors
      });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway is not configured on the server.'
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer || customer.cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    // Merge duplicate cart lines so stock is checked against the real demand.
    const demand = new Map();
    for (const line of customer.cart) {
      const key = line.product.toString();
      demand.set(key, (demand.get(key) || 0) + line.quantity);
    }

    // Load the LATEST product documents (price + stock may have changed).
    const products = await Product.find({ _id: { $in: [...demand.keys()] } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems = [];
    let totalAmount = 0;

    for (const [productId, quantity] of demand) {
      const product = productMap.get(productId);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'A product in your cart is no longer available. Please remove it and try again.'
        });
      }
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message:
            product.stock === 0
              ? `${product.name} is out of stock.`
              : `Insufficient stock for ${product.name}. Only ${product.stock} available, you requested ${quantity}.`
        });
      }

      totalAmount += product.price * quantity;

      // Purchase-time snapshot (intentionally NOT just a product reference)
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image
      });
    }

    totalAmount = round2(totalAmount);
    if (totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid order total.' });
    }

    // Remove this user's abandoned, unpaid checkout attempts so they never
    // clutter the database or order history.
    await Order.deleteMany({
      user: customer._id,
      status: 'PENDING_PAYMENT',
      paymentStatus: { $ne: 'PAID' }
    });

    const shopKartOrder = await Order.create({
      user: customer._id,
      items: orderItems,
      shippingAddress: clean,
      totalAmount,
      paymentStatus: 'PENDING',
      status: 'PENDING_PAYMENT'
    });

    // Razorpay expects the smallest currency unit (paise for INR)
    const amountInPaise = Math.round(totalAmount * 100);

    let razorpayOrder;
    try {
      razorpayOrder = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: shopKartOrder._id.toString()
      });
    } catch (gatewayError) {
      await Order.deleteOne({ _id: shopKartOrder._id }); // cart untouched, no orphan order
      return res.status(502).json({
        success: false,
        message:
          gatewayError?.error?.description ||
          'Could not reach the payment gateway. Please try again.'
      });
    }

    shopKartOrder.razorpayOrderId = razorpayOrder.id;
    await shopKartOrder.save();

    return res.status(201).json({
      success: true,
      shopKartOrderId: shopKartOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID // Key ID is public; the secret never leaves the server
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating payment order.'
    });
  }
};

// ---------------------------------------------------------------------------
// 2. POST /orders/verify-payment
//    Verifies the Razorpay HMAC signature. Only then: mark PAID/PLACED,
//    reduce stock and clear the cart.
// ---------------------------------------------------------------------------
export const verifyPayment = async (req, res) => {
  try {
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body || {};

    if (!shopKartOrderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details.' });
    }
    if (!isValidId(shopKartOrderId)) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Already confirmed (e.g. double submit): respond idempotently, never decrement stock twice.
    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified.',
        order
      });
    }

    // The browser-supplied order id must match the one WE stored.
    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: 'Payment does not match this order.' });
    }

    // The trusted order id comes from the database, not from the request body.
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
      .digest('hex');

    const received = Buffer.from(String(razorpay_signature));
    const expected = Buffer.from(expectedSignature);
    const signatureOk =
      received.length === expected.length && crypto.timingSafeEqual(received, expected);

    if (!signatureOk) {
      // Order stays PENDING_PAYMENT and the cart is untouched.
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }

    // Atomically claim the order so concurrent verify calls cannot both succeed.
    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, status: 'PENDING_PAYMENT' },
      {
        $set: {
          paymentStatus: 'PAID',
          status: 'PLACED',
          razorpayPaymentId: razorpay_payment_id
        }
      },
      { new: true }
    );

    if (!claimed) {
      const latest = await Order.findById(order._id);
      return res.status(200).json({ success: true, message: 'Payment already verified.', order: latest });
    }

    // Reduce stock atomically (never below zero).
    const decremented = [];
    let stockFailure = null;
    for (const item of claimed.items) {
      const result = await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
      if (result.modifiedCount === 0) {
        stockFailure = item.name;
        break;
      }
      decremented.push(item);
    }

    if (stockFailure) {
      // Someone else bought the last units between order creation and payment. Roll back.
      for (const item of decremented) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
      }
      await Order.updateOne(
        { _id: claimed._id },
        { $set: { paymentStatus: 'PENDING', status: 'PENDING_PAYMENT' } }
      );
      return res.status(409).json({
        success: false,
        message: `${stockFailure} went out of stock while you were paying. Your cart is unchanged — please contact support with payment id ${razorpay_payment_id} for a refund.`
      });
    }

    // Cart is cleared ONLY now, after verified payment.
    await Customer.updateOne({ _id: req.user._id }, { $set: { cart: [] } });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order placed successfully!',
      order: claimed
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while verifying payment.'
    });
  }
};

// ---------------------------------------------------------------------------
// 3. POST /orders/payment-failed   (client reports a failed Razorpay attempt)
//    Marks an unpaid order FAILED. Cart is kept. A later valid payment for the
//    same Razorpay order can still be verified.
// ---------------------------------------------------------------------------
export const markPaymentFailed = async (req, res) => {
  try {
    const { shopKartOrderId } = req.body || {};
    if (!shopKartOrderId || !isValidId(shopKartOrderId)) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = await Order.findOneAndUpdate(
      { _id: shopKartOrderId, user: req.user._id, paymentStatus: { $ne: 'PAID' } },
      { $set: { paymentStatus: 'FAILED' } },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    return res.status(200).json({ success: true, message: 'Payment marked as failed. Your cart is unchanged.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// 4. GET /orders — current user's confirmed orders, newest first
// ---------------------------------------------------------------------------
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
      status: { $ne: 'PENDING_PAYMENT' } // unpaid checkout attempts are not "orders" yet
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching orders.'
    });
  }
};

// ---------------------------------------------------------------------------
// 5. GET /orders/:id — single order, ownership enforced.
//    Someone else's order returns 404 (same as a non-existent one) so IDs
//    can't be probed.
// ---------------------------------------------------------------------------
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching order details.'
    });
  }
};

// ---------------------------------------------------------------------------
// 6. BONUS: PATCH /orders/:id/status — development/admin helper.
//    Disabled unless ADMIN_KEY is set in .env; send it as `x-admin-key`.
//    Status can only move forward: PLACED → CONFIRMED → SHIPPED → DELIVERED.
// ---------------------------------------------------------------------------
export const updateOrderStatus = async (req, res) => {
  try {
    const adminKey = process.env.ADMIN_KEY;
    if (!adminKey || req.headers['x-admin-key'] !== adminKey) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    const { id } = req.params;
    const { status } = req.body || {};
    if (!isValidId(id)) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (!STATUS_FLOW.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${STATUS_FLOW.join(', ')}.`
      });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.paymentStatus !== 'PAID') {
      return res.status(400).json({ success: false, message: 'Only paid orders can progress.' });
    }
    if (STATUS_FLOW.indexOf(status) <= STATUS_FLOW.indexOf(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order is already ${order.status}; status can only move forward.`
      });
    }

    order.status = status;
    await order.save();
    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
