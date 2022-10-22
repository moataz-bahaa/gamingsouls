const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = async (req, res, next) => {
  try {
    // authorization tokent from header: 'Bearer token'
    const authHeader = req.get('Authorization');
    if (!authHeader) {
      const error = new Error('Not authenticated!');
      error.statusCode = 401;
      throw error;
    }
    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      const error = new Error('Not authenticated!');
      error.statusCode = 401;
      throw error;
    }
    const user = await User.findById(decodedToken.userId);
    if (!user) {
      const err = new Error('you are not authenticated, try to logout and login again');
      err.statusCode = 401;
      throw err;
    }
    req.userId = decodedToken.userId;
    next();
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
