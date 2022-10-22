const express = require('express');

const { getProductById, getProducts } = require('../controllers/product');

const router = express.Router();

// /api/products
router.get('/', getProducts);

router.get('/:id', getProductById);

module.exports = router;