import express from 'express';
import {
  register,
  login,
  logout,
  getMyProfile,
  changePassword
} from '../controllers/customer.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

router.get('/profile', protectRoute, getMyProfile);
router.post('/change-password', protectRoute, changePassword);

export default router;