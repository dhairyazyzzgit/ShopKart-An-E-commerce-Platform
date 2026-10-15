import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  markPaymentFailed,
  getMyOrders,
  getOrderById,
  updateOrderStatus
} from '../controllers/order.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Every order endpoint requires a logged-in user
router.use(protectRoute);

router.post('/', createPaymentOrder); // alias, so `POST /orders` with an empty cart → 400
router.post('/create-payment-order', createPaymentOrder);
router.post('/verify-payment', verifyPayment);
router.post('/payment-failed', markPaymentFailed);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus); // bonus (needs ADMIN_KEY)

export default router;
