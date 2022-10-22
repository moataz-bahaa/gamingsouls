const express = require('express');

const adminController = require('../controllers/admin');
const isAdmin = require('../middewares/is-Admin');

const router = express.Router();

// /api/admin

// authentication
router.post('/login', adminController.login);
router.get('/get', isAdmin, adminController.getAdminData);

// products
router.post('/product', adminController.addProduct);

router.delete('/product/:id', adminController.deleteProductById);

router.put('/product/:id', adminController.updateProduct);

// destinations
router.get('/destinations', adminController.getDistinations)

router.post('/destination', adminController.addDestination);

router.put('/destination/:id', adminController.editDestination);

router.delete('/destination/:id', adminController.deleteDestination);

// users
router.get('/users', isAdmin, adminController.getUsers);

router.get('/users/:id', isAdmin, adminController.getUserById);

router.delete('/user/:id', isAdmin, adminController.deleteUser);

// orders
router.get('/orders', isAdmin, adminController.getOrders);

router.get('/order/:id', isAdmin, adminController.getOrderById);

router.put('/order/:id', isAdmin, adminController.approveOrderById);

router.delete('/order/:id', isAdmin, adminController.deleteOrderById);

module.exports = router;