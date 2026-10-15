import express from 'express';
import {
  addToCart,
  getCart,
  updateQuantity,
  removeFromCart
} from '../controllers/cart.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protectRoute);

router.post('/:productId', addToCart);
router.get('/', getCart);
router.patch('/:productId', updateQuantity);
router.delete('/:productId', removeFromCart);

export default router;