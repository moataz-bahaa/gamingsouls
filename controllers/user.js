const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Product = require('../models/product');
const Destination = require('../models/destination');
const Order = require('../models/order');

exports.signup = async (req, res, next) => {
  try {
    const { username, password, phone1, phone2, name, address } = req.body;
    const isExist = await User.findOne({ username });
    if (isExist) {
      const error = new Error('This username exits');
      error.statusCode = 400;
      throw error;
    }
    const user = await User.create({
      username,
      password,
      phone1,
      phone2,
      name,
      address,
    });

    const userDoc = user._doc;
    delete userDoc.password;
    res.json({
      message: 'user created successfully',
      user: userDoc,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) {
      const error = new Error('incorrect username or password');
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET
    );
    res.status(200).json({
      token,
      user: {
        userId: user._id.toString(),
        username: user.username,
        name: user.name,
        address: user.address,
      },
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// cart
exports.getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate('cart.products.product');
    res.json(user.cart);
  } catch (err) {
    next(err);
  }
};

exports.addProductToCart = async (req, res, next) => {
  try {
    const { productId, amount } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      const err = new Error('user not found');
      err.statusCode = 404;
      throw err;
    }
    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('product not found');
      err.statusCode = 404;
      throw err;
    }
    if (amount > product.amount) {
      const err = new Error(`there is no enough amount in the store`);
      err.statusCode = 404;
      throw err;
    }
    const productIndex = user.cart.products.findIndex(
      (p) => p.product.toString() === productId
    );
    if (productIndex >= 0) {
      user.cart.totalPrice -= user.cart.products[productIndex].amount * product.price;
      user.cart.products[productIndex].amount = amount;
      user.cart.totalPrice += user.cart.products[productIndex].amount * product.price;
      // console.log(user.cart.products[productIndex]);
    } else {
      user.cart.products.push({ product: productId, amount });
      user.cart.totalPrice += amount * product.price;
    }
    await user.save();
    res.json({
      message: 'product added successfully',
      cart: user.cart,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteProductFromCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.userId).populate('cart.products.product');
    const productIndex = user.cart.products.findIndex(
      (p) => p.product._id.toString() === productId
    );
    const price = user.cart.products[productIndex].product.price;
    user.cart.totalPrice -= user.cart.products[productIndex].amount * price;
    user.cart.products = user.cart.products.filter(
      (p) => p.product._id.toString() !== productId
    );
    await user.save();
    res.json({
      message: 'product deleted successfully',
      cart: user.cart,
    });
  } catch (err) {
    next(err);
  }
};

exports.editCartProductAmount = async (req, res, next) => {
  try {
    const { productId, amount } = req.body;
    const user = await User.findById(req.userId).populate('cart.products.product');
    const productIndex = user.cart.products.findIndex(
      (p) => p.product._id.toString() === productId
    );
    if (productIndex === -1) {
      const err = new Error(`can't find product`);
      err.statusCode = 404;
      throw err;
    }
    if (amount > user.cart.products[productIndex].product.amount) {
      const err = new Error(`there is no enough amount in the store`);
      err.statusCode = 404;
      throw err;
    }
    const price = user.cart.products[productIndex].product.price;
    user.cart.totalPrice -= user.cart.products[productIndex].amount * price;
    user.cart.products[productIndex].amount = amount;
    user.cart.totalPrice += user.cart.products[productIndex].amount * price;
    await user.save();
    res.json({
      message: 'product edited successfully',
      cart: user.cart,
    });
  } catch (err) {
    next(err);
  }
};

exports.getDestinations = async (req, res, next) => {
  try {
    const destinations = await Destination.find();
    res.json(destinations);
  } catch (err) {
    next(err);
  }
};

// orders
exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.userId }).sort({ cancelExpirationDate: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const { destinationId, address, createdAt } = req.body;
    const user = await User.findById(req.userId).populate('cart.products.product');
    const destination = await Destination.findById(destinationId);
    if (!destination || !user) {
      const err = new Error('something went wrong');
      err.statusCode = 500;
      throw err;
    }
    let productsPrice = 0,
      productsCount = 0;
    const products = user.cart.products.map((p) => {
      productsPrice += p.amount * p.product.price;
      productsCount += p.amount;
      return {
        title: p.product.title,
        description: p.product.description,
        imageUrl: p.product.imageUrl,
        notes: p.product.notes,
        price: p.product.price,
        amount: p.amount,
        totalPrice: p.amount * p.product.price,
      };
    });
    // each product is 1/2 kg
    const totalWeight = productsCount / 2;
    let shippingPrice = destination.shippingPrice;
    if (destination.destinationType === 'Upper Egypt') {
      shippingPrice += 5 * (totalWeight - 1);
      shippingPrice += 0.14 * shippingPrice;
      shippingPrice += 5;
    }
    const order = await Order.create({
      destination: {
        destinationType: destination.destinationType,
        name: destination.name,
        shippingPrice,
      },
      address,
      products,
      totalPrice: productsPrice + shippingPrice,
      user: req.userId,
      cancelExpirationDate: Date.now() + 12 * 60 * 60 * 1000,
      createdAt
    });

    user.cart = {
      products: [],
      totalPrice: 0,
    };
    await user.save();

    res.json({
      message: 'Order created successfully',
      order,
    });
  } catch (err) {
    next(err);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (order.user.toString() !== req.userId) {
      const err = new Error(`You can't cancel this order`);
      err.statusCode = 401;
      throw err;
    }
    if (order.cancelExpirationDate < Date.now()) {
      const err = new Error(`only can cancel order in 12h`);
      err.statusCode = 401;
      throw err;
    }
    if (order.isApproved) {
      const err = new Error(`sorry your order has been approved by the admin, you can't cancel it`);
      err.statusCode = 401;
      throw err;
    }
    await order.delete();
    res.json({
      message: 'Order canceled successfully',
    });
  } catch (err) {
    next(err);
  }
};
