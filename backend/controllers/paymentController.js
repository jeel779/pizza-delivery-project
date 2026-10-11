const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const { checkIngredientsAvailability, decrementStock } = require('./orderController');

// Helper to check if Razorpay is configured
const isRazorpayConfigured = () => {
  return process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;
};

// @desc    Create Razorpay order (or simulated order)
// @route   POST /api/payments/checkout
// @access  Private
exports.createCheckoutOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Please provide the order ID' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.payment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Order is already paid' });
    }

    // Verify stock one last time before payment initiation
    const stockStatus = await checkIngredientsAvailability(order.pizzaDetails);
    if (!stockStatus.available) {
      return res.status(400).json({
        success: false,
        message: `Ingredient out of stock: ${stockStatus.missingItem}`,
      });
    }

    const amountInPaisa = Math.round(order.totalPrice * 100);

    if (isRazorpayConfigured()) {
      // Real Razorpay integration
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const options = {
        amount: amountInPaisa,
        currency: 'INR',
        receipt: orderId.toString(),
      };

      instance.orders.create(options, async (err, rzOrder) => {
        if (err) {
          console.error('Razorpay order creation error:', err);
          return res.status(500).json({ success: false, message: 'Razorpay order creation failed', error: err });
        }

        // Store Razorpay Order ID on pending order
        order.payment.razorpayOrderId = rzOrder.id;
        await order.save();

        return res.status(200).json({
          success: true,
          simulated: false,
          keyId: process.env.RAZORPAY_KEY_ID,
          amount: rzOrder.amount,
          currency: rzOrder.currency,
          razorpayOrderId: rzOrder.id,
          orderId: order._id,
        });
      });
    } else {
      // Simulated Razorpay integration
      const mockRazorpayOrderId = `rzp_mock_${crypto.randomBytes(8).toString('hex')}`;
      order.payment.razorpayOrderId = mockRazorpayOrderId;
      await order.save();

      console.log(`[PAYMENT SIMULATION] Created mock payment order: ${mockRazorpayOrderId}`);

      return res.status(200).json({
        success: true,
        simulated: true,
        keyId: 'MOCK_RAZORPAY_KEY_ID',
        amount: amountInPaisa,
        currency: 'INR',
        razorpayOrderId: mockRazorpayOrderId,
        orderId: order._id,
      });
    }
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, message: 'Server error during payment checkout creation' });
  }
};

// @desc    Verify Razorpay payment signature (or simulate signature verification)
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature, simulated } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({ success: false, message: 'Please provide all verification details' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.payment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Order is already paid' });
    }

    // Verify stock one final time before updating payment
    const stockStatus = await checkIngredientsAvailability(order.pizzaDetails);
    if (!stockStatus.available) {
      return res.status(400).json({
        success: false,
        message: `Failed to confirm order. Ingredient went out of stock: ${stockStatus.missingItem}`,
      });
    }

    let isSignatureValid = false;

    if (isRazorpayConfigured() && !simulated) {
      // Real Signature Verification
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpayOrderId + '|' + razorpayPaymentId)
        .digest('hex');

      isSignatureValid = generatedSignature === razorpaySignature;
    } else {
      // Simulated validation for mock checkout or if keys are absent
      isSignatureValid = true;
      console.log(`[PAYMENT SIMULATION] Verifying mock payment signature for Order ID: ${orderId}`);
    }

    if (!isSignatureValid) {
      order.payment.status = 'failed';
      await order.save();
      return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
    }

    // Update order status to paid and confirm payment details
    order.payment.status = 'paid';
    order.payment.razorpayPaymentId = razorpayPaymentId;
    order.payment.razorpaySignature = razorpaySignature || 'MOCK_SIGNATURE';
    order.status = 'Order Received'; // Start the process
    await order.save();

    // Decrement stock levels for this order
    await decrementStock(order.pizzaDetails);
    console.log(`[STOCK UPDATE] Ingredients decremented successfully for Order ID: ${order._id}`);

    // Notify client and admin of new order placement
    const io = req.app.get('socketio');
    if (io) {
      // Room for user order updates
      io.to(order.user.toString()).emit('orderStatusUpdate', {
        orderId: order._id,
        status: order.status,
        paymentStatus: 'paid'
      });
      // Broadcast to admin dashboard
      io.emit('newOrderPlaced', order);
      io.emit('stockUpdate');
    }

    res.status(200).json({ success: true, message: 'Payment verified and order confirmed successfully', order });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during payment verification' });
  }
};
