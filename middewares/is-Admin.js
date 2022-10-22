const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
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
    req.adminId = decodedToken.adminId;
    next();
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    throw err;
  }
};
