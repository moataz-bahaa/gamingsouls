require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const rootDir = require('./util/path');

const corsMiddleware = require('./middewares/cors');

const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/product');

const app = express();

// middlewars
app.use(express.json());
app.use(express.static(path.join(rootDir, 'public', 'client', 'build')));
app.use(express.static(path.join(rootDir, 'public', 'admin', 'build')));
app.use(corsMiddleware);

// routes
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);

// react app
app.get(
  [
    '/adminn',
    '/admin/login',
    '/admin/users',
    '/admin/user/:id',
    '/admin/products',
    '/admin/product/:id',
    '/admin/orders',
    '/admin/order/:id',
    '/admin/destinations',
  ],
  (req, res) => {
    res.sendFile(path.join(rootDir, 'public', 'admin', 'build', 'index.html'));
  }
);

app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'client', 'build', 'index.html'));
});

// error handling
app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    message: error.message || 'Error on the server',
  });
});

const port = process.env.PORT || 5000;
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`server is running on port: ${port}`);
    });
  } catch (err) {
    console.log(err);
  }
})();
