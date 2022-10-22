const jwt = require('jsonwebtoken');

const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');
const Destination = require('../models/destination');
const Admin = require('../models/admin');

const { ITEMS_PER_PAGE } = require('../util/constants');

// authentication
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username, password });
    if (!admin) {
      const err = new Error('Incorrect username or password');
      err.statusCode = 400;
      throw err;
    }
    const token = jwt.sign(
      { adminId: admin._id, name: admin.name },
      process.env.JWT_SECRET
    );
    res.json({
      token,
      username: admin.username,
      name: admin.name,
      profit: admin.profit,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAdminData = async (req, res, next) => {
  try {
    const admin = await Admin.findOne();
    res.json({
      username: admin.username,
      name: admin.name,
      profit: admin.profit,
    });
  } catch (err) {
    next(err);
  }
};

// products
exports.addProduct = async (req, res, next) => {
  try {
    const { title, description, amount, price, imageUrl, notes } = req.body;
    const product = await Product.create({
      title,
      description,
      amount,
      price,
      imageUrl,
      notes,
    });

    res.status(201).json({
      message: 'product created successfully',
      product,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { title, description, amount, price, imageUrl, notes } = req.body;
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      const err = new Error('product not found');
      err.statusCode = 404;
      throw err;
    }
    if (title) product.title = title;
    if (description) product.description = description;
    if (amount) product.amount = amount;
    if (price) product.price = price;
    if (imageUrl) product.imageUrl = imageUrl;
    if (notes) product.notes = notes;
    await product.save();
    res.status(201).json({
      message: 'product updated successfully',
      product,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }

    // delete product from all users cart
    // await User.updateMany(
    //   {},
    //   {
    //     $pull: {
    //       'cart.products': {
    //         product: product._id,
    //       },
    //     },
    //   }
    // );

    await User.updateMany(
      {},
      {
        $set: {
          cart: {
            products: [],
            totalPrice: 0,
          },
        },
      }
    );

    await product.delete();
    res.json({
      message: 'product deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// destinations
exports.getDistinations = async (req, res, next) => {
  try {
    const destinations = await Destination.find();
    res.json(destinations);
  } catch (err) {
    next(err);
  }
};

exports.addDestination = async (req, res, next) => {
  try {
    const { name, shippingPrice, destinationType } = req.body;
    const dest = await Destination.create({
      name,
      shippingPrice,
      destinationType,
    });
    res.json({
      message: 'destination created succesfully',
      destination: dest,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteDestination = async (req, res, next) => {
  try {
    const { id } = req.params;
    const destination = await Destination.findById(id);
    if (!destination) {
      const err = new Error('destination not found');
      err.statusCode = 404;
      throw err;
    }
    await destination.delete();
    res.json({
      message: 'destination deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.editDestination = async (req, res, next) => {
  try {
    const { name, shippingPrice, destinationType } = req.body;
    const { id } = req.params;
    const destination = await Destination.findById(id);
    if (!destination) {
      const err = new Error('destination not found');
      err.statusCode = 404;
      throw err;
    }
    if (name) destination.name = name;
    if (shippingPrice) destination.shippingPrice = shippingPrice;
    if (destinationType) destination.destinationType = destinationType;
    await destination.save();
    res.json({
      message: 'destination updated successfully',
      destination,
    });
  } catch (err) {
    next(err);
  }
};

// users
exports.getUsers = async (req, res, next) => {
  try {
    const page = +req.query.page ?? 1;
    const countUsers = await User.countDocuments();
    const users = await User.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    const usersDocs = users.map((u) => {
      return {
        _id: u._id,
        username: u.username,
        name: u.name,
        phone1: u.phone1,
        phone2: u.phone2,
        address: u.address,
      };
    });
    res.json({
      users: usersDocs,
      numberOfPages: Math.ceil(countUsers / ITEMS_PER_PAGE),
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate('cart.products.product');
    const orders = await Order.find({ user: id });
    if (!user) {
      const err = new Error('user not found');
      err.statusCode = 404;
      throw err;
    }
    res.json({
      ...user._doc,
      orders: orders.map((o) => {
        return {
          _id: o._id,
          destination: o.destination,
          address: o.address,
          totalPrice: o.totalPrice,
          isApproved: o.isApproved,
          cancelExpirationDate: o.cancelExpirationDate,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      const err = new Error('user not found');
      err.statusCode = 404;
      throw err;
    }

    // delete all orders related to that user
    await Order.deleteMany({ user: user._id });

    await user.delete();
    res.json({
      message: 'user deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// orders
exports.getOrders = async (req, res, next) => {
  try {
    const page = +req.query.page ?? 1;
    const countOrders = await Order.countDocuments();
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .populate('user');
    res.json({
      orders: orders.map((o) => {
        return {
          _id: o._id,
          destination: o.destination,
          address: o.address,
          totalPrice: o.totalPrice,
          isApproved: o.isApproved,
          user: {
            _id: o.user._id,
            username: o.user.username,
            name: o.user.name,
          },
          createdAt:o.createdAt,
        };
      }),
      numberOfPages: Math.ceil(countOrders / ITEMS_PER_PAGE),
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('user');
    if (!order) {
      const err = new Error('order not found');
      err.statusCode = 404;
      throw err;
    }
    res.json({
      ...order._doc,
      user: {
        _id: order.user._id,
        username: order.user.username,
        name: order.user.name,
        phone1: order.user.phone1,
        phone2: order.user.phone2,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Order.findByIdAndRemove(id);
    res.json({
      message: 'order deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.approveOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    const admin = await Admin.findOne();
    if (!order) {
      const err = new Error('order not found');
      err.statusCode = 404;
      throw err;
    }
    order.isApproved = true;
    admin.profit += order.totalPrice;
    await order.save();
    await admin.save();
    res.json({
      message: 'order approved successfully',
    });
  } catch (err) {
    next(err);
  }
};
