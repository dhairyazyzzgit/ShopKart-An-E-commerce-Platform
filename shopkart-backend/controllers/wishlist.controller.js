import Customer from '../models/customer.model.js';

// Add item to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (!customer.wishlist.includes(productId)) {
      customer.wishlist.push(productId);
      await customer.save();
    }

    const updatedCustomer = await Customer.findById(req.user._id).populate('wishlist');
    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      wishlist: updatedCustomer.wishlist
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Remove item from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.wishlist = customer.wishlist.filter(
      (id) => id.toString() !== productId.toString()
    );
    await customer.save();

    const updatedCustomer = await Customer.findById(req.user._id).populate('wishlist');
    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      wishlist: updatedCustomer.wishlist
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get user wishlist with populated product details
export const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate('wishlist');
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    return res.status(200).json({
      success: true,
      wishlist: customer.wishlist || []
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle item in wishlist
export const toggleWishlist = async (req, res) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const index = customer.wishlist.indexOf(productId);
    if (index === -1) {
      customer.wishlist.push(productId);
    } else {
      customer.wishlist.splice(index, 1);
    }

    await customer.save();
    const updatedCustomer = await Customer.findById(req.user._id).populate('wishlist');

    return res.status(200).json({
      success: true,
      wishlist: updatedCustomer.wishlist
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};