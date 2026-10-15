import Customer from '../models/customer.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Helper function to set JWT cookie safely across environments
const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// 1. Register Customer
export const register = async (req, res) => {
  try {
    const { fullName, name, email, password, phone } = req.body;
    const customerName = (fullName || name || '').trim();

    if (!customerName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingEmail = await Customer.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this Email already exists.'
      });
    }

    if (phone && phone.trim()) {
      const existingPhone = await Customer.findOne({ phone: phone.trim() });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'An account with this Phone Number already exists.'
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newCustomer = new Customer({
      name: customerName,
      fullName: customerName,
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : undefined
    });

    await newCustomer.save();

    return res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.'
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      const fieldName = field === 'email' ? 'Email' : field === 'phone' ? 'Phone Number' : field;
      return res.status(400).json({
        success: false,
        message: `An account with this ${fieldName} already exists.`
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.'
    });
  }
};

// 2. Login Customer
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const customer = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      { id: customer._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    setAuthCookie(res, token);

    const userPayload = {
      _id: customer._id,
      name: customer.name || customer.fullName,
      fullName: customer.fullName || customer.name,
      email: customer.email,
      phone: customer.phone
    };

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: userPayload
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.'
    });
  }
};

// 3. Logout
export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('jwt', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      expires: new Date(0)
    });
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get My Profile
export const getMyProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).select('-password');
    return res.status(200).json({ success: true, user: customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Change Password
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, customer.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect old password' });
    }

    const salt = await bcrypt.genSalt(10);
    customer.password = await bcrypt.hash(newPassword, salt);
    await customer.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Export aliases for router naming consistency
export const loginCustomer = login;
export const registerCustomer = register;
export const logoutCustomer = logout;
export const getProfile = getMyProfile;