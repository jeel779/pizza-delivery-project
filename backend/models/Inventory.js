const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide the inventory item name'],
    unique: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['base', 'sauce', 'cheese', 'vegetable'],
    required: [true, 'Please provide the category (base, sauce, cheese, vegetable)'],
  },
  stock: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  price: {
    type: Number,
    required: [true, 'Please provide price for this ingredient'],
    min: [0, 'Price cannot be negative'],
    default: 0,
  },
  threshold: {
    type: Number,
    default: 20,
    min: [0, 'Threshold cannot be negative'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Inventory', inventorySchema);
