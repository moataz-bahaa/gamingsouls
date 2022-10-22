const express = require('express');

const {
  login,
  signup,
  addProductToCart,
  deleteProductFromCart,
  editCartProductAmount,
  getCart,
  getDestinations,
  createOrder,
  cancelOrder,
  getOrders
} = require('../controllers/user');

const isAuth = require('../middewares/is-auth');

const router = express.Router();

// /api/user

// authenticatoin
router.post('/signup', signup);

router.post('/login', login);

// cart
router.get('/cart', isAuth, getCart);

router.post('/cart', isAuth, addProductToCart);

router.put('/cart', isAuth, editCartProductAmount);

router.delete('/cart', isAuth, deleteProductFromCart);

// destinations
router.get('/destinations', getDestinations);

// orders
router.get('/orders', isAuth, getOrders);

router.post('/orders', isAuth, createOrder);

router.delete('/orders', isAuth, cancelOrder);

module.exports = router;
