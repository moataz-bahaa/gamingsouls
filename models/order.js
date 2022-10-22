const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    destination: {
      destinationType: String,
      name: String,
      shippingPrice: String,
    },
    address: {
      type: String,
      required: true,
    },
    totalPrice: {
      required: true,
      type: Number,
    },
    products: [
      {
        title: String,
        description: String,
        imageUrl: String,
        notes: String,
        price: Number,
        amount: Number,
        totalPrice: Number,
      },
    ],
    isApproved: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelExpirationDate: {
      required: true,
      type: Number,
    },
    createdAt: {
      required: true,
      type: String
    }
  },
);

module.exports = mongoose.model('Order', schema);
