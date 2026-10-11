const express = require('express');
const router = express.Router();
const { createCheckoutOrder, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/checkout', protect, createCheckoutOrder);
router.post('/verify', protect, verifyPayment);

module.exports = router;
