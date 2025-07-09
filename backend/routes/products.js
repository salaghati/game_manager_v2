const express = require('express');
const router = express.Router();
const { Product, WarehouseStock } = require('../models');

// GET all non-deleted products
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { is_deleted: false },
      order: [['name', 'ASC']]
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error });
  }
});

// POST a new product
router.post('/', async (req, res) => {
  const { name, price, description } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ message: 'Name and price are required' });
  }

  try {
    const newProduct = await Product.create({ name, price, description });
    // Also create an initial stock record for the new product
    await WarehouseStock.create({ product_id: newProduct.id, quantity: 0 });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error });
  }
});

// PUT (update) a product by ID
router.put('/:id', async (req, res) => {
  const { name, price, description } = req.body;
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await product.update({ name, price, description });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error });
  }
});

// DELETE (soft delete) a product by ID
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await product.update({ is_deleted: true });
    res.status(204).send(); // No content
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error });
  }
});

module.exports = router; 