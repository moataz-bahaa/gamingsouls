const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: {
    required: true,
    type: String,
  },
  shippingPrice: {
    required: true,
    type: Number
  },
  destinationType: {
    required: true,
    type: String
  }
});

module.exports = mongoose.model('Destination', schema);