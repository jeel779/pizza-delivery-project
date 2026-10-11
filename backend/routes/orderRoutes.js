const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getUserOrders);

// Admin-only endpoints
router.get('/', protect, restrictTo('admin'), getAllOrders);
router.put('/:id/status', protect, restrictTo('admin'), updateOrderStatus);

module.exports = router;
