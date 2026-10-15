import mongoose from 'mongoose';
import Customer from '../models/customer.model.js';
import Product from '../models/product.model.js';

// Builds the cart payload sent to the client:
//   [{ _id, productId, product: <latest Product> | null, quantity }]
// `product` is null when the product was deleted after being added, so the UI
// can flag it (and still offer a Remove button using `productId`).
const buildCart = async (customerId) => {
  const customer = await Customer.findById(customerId);
  if (!customer) return [];

  const ids = customer.cart.map((line) => line.product);
  const products = await Product.find({ _id: { $in: ids } });
  const map = new Map(products.map((p) => [p._id.toString(), p]));

  return customer.cart.map((line) => ({
    _id: line._id,
    productId: line.product,
    product: map.get(line.product.toString()) || null,
    quantity: line.quantity
  }));
};

const invalidId = (res) =>
  res.status(400).json({ success: false, message: 'Invalid product ID format' });

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) return invalidId(res);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const customer = await Customer.findById(req.user._id);
    const line = customer.cart.find((item) => item.product.toString() === productId);

    if (line) {
      if (line.quantity + 1 > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Stock limit is ${product.stock}`
        });
      }
      line.quantity += 1;
    } else {
      if (product.stock < 1) {
        return res.status(400).json({ success: false, message: 'Product is out of stock' });
      }
      customer.cart.push({ product: productId, quantity: 1 });
    }

    await customer.save();
    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart: await buildCart(req.user._id)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCart = async (req, res) => {
  try {
    return res.status(200).json({ success: true, cart: await buildCart(req.user._id) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = Number(req.body?.quantity);
    if (!mongoose.Types.ObjectId.isValid(productId)) return invalidId(res);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be a whole number of at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock`
      });
    }

    const customer = await Customer.findById(req.user._id);
    const line = customer.cart.find((item) => item.product.toString() === productId);
    if (!line) {
      return res.status(404).json({ success: false, message: 'Product not in cart' });
    }

    line.quantity = quantity;
    await customer.save();

    return res.status(200).json({ success: true, cart: await buildCart(req.user._id) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const customer = await Customer.findById(req.user._id);
    customer.cart = customer.cart.filter((item) => item.product.toString() !== productId);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: await buildCart(req.user._id)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
