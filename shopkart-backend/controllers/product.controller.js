import Product from '../models/product.model.js';
import mongoose from 'mongoose';

// 1. Create a new product
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    if (!name || !description || price === undefined || !category || !image || stock === undefined) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }

    if (price <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be greater than 0.' });
    }

    if (stock < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot be negative.' });
    }

    const product = new Product({ name, description, price, category, image, stock });
    await product.save();

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get all products (with Search, Category, and Sort support)
export const getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    let query = {};

    // Search filter (case-insensitive name match)
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Sorting (Bonus implementation)
    let sortOption = {};
    if (sort === 'price_asc') {
      sortOption.price = 1;
    } else if (sort === 'price_desc') {
      sortOption.price = -1;
    } else {
      sortOption.createdAt = -1; // Default: newest first
    }

    const products = await Product.find(query).sort(sortOption);

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};