const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customPizza: {
    type: Boolean,
    default: true,
  },
  pizzaDetails: {
    base: {
      type: String,
      required: true,
    },
    sauce: {
      type: String,
      required: true,
    },
    cheese: {
      type: String,
      required: true,
    },
    vegetables: {
      type: [String],
      default: [],
    },
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
  },
  status: {
    type: String,
    enum: ['Order Received', 'In Kitchen', 'Sent to Delivery'],
    default: 'Order Received',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', orderSchema);
