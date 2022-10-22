const Product = require('../models/product');

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      const err = new Error('product not found');
      err.statusCode = 404;
      throw err;
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
};
