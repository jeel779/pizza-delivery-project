const Order = require('../models/Order');
const Inventory = require('../models/Inventory');

// Helper to check ingredient stock availability
const checkIngredientsAvailability = async (pizzaDetails) => {
  const { base, sauce, cheese, vegetables } = pizzaDetails;
  
  // Collect all ingredients needed
  const requiredItems = [base, sauce, cheese, ...vegetables];
  
  // Retrieve items from DB
  const items = await Inventory.find({ name: { $in: requiredItems } });
  
  const availability = { available: true, missingItem: null };

  // Map to easily check stock
  const stockMap = {};
  items.forEach(item => {
    stockMap[item.name] = item.stock;
  });

  // Verify base
  if (stockMap[base] === undefined || stockMap[base] < 1) {
    return { available: false, missingItem: `Base: ${base}` };
  }
  // Verify sauce
  if (stockMap[sauce] === undefined || stockMap[sauce] < 1) {
    return { available: false, missingItem: `Sauce: ${sauce}` };
  }
  // Verify cheese
  if (stockMap[cheese] === undefined || stockMap[cheese] < 1) {
    return { available: false, missingItem: `Cheese: ${cheese}` };
  }
  // Verify vegetables
  for (const veg of vegetables) {
    if (stockMap[veg] === undefined || stockMap[veg] < 1) {
      return { available: false, missingItem: `Vegetable: ${veg}` };
    }
  }

  return availability;
};

// Helper to decrement stock
const decrementStock = async (pizzaDetails) => {
  const { base, sauce, cheese, vegetables } = pizzaDetails;
  const itemsToDecrement = [base, sauce, cheese, ...vegetables];
  
  for (const itemName of itemsToDecrement) {
    await Inventory.findOneAndUpdate(
      { name: itemName },
      { $inc: { stock: -1 } }
    );
  }
};

exports.checkIngredientsAvailability = checkIngredientsAvailability;
exports.decrementStock = decrementStock;

// @desc    Create a pending order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { customPizza, pizzaDetails, totalPrice } = req.body;

    if (!pizzaDetails || !totalPrice) {
      return res.status(400).json({ success: false, message: 'Please provide pizza details and total price' });
    }

    // Verify stock availability
    const stockStatus = await checkIngredientsAvailability(pizzaDetails);
    if (!stockStatus.available) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be placed. Ingredient out of stock: ${stockStatus.missingItem}`,
      });
    }

    // Create pending order
    const order = await Order.create({
      user: req.user._id,
      customPizza,
      pizzaDetails,
      totalPrice,
      payment: {
        status: 'pending',
      },
    });

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error creating order' });
  }
};

// @desc    Get user's order history
// @route   GET /api/orders/my-orders
// @access  Private
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving your orders' });
  }
};

// @desc    Get all orders for admin
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving all orders' });
  }
};

// @desc    Update order status and notify user
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['Order Received', 'In Kitchen', 'Sent to Delivery'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Emit live update to the client via Socket.io
    const io = req.app.get('socketio');
    if (io) {
      // Room based on userId
      io.to(order.user.toString()).emit('orderStatusUpdate', {
        orderId: order._id,
        status: order.status,
      });
      // Also notify generally
      io.emit('orderUpdate', order);
    }

    res.status(200).json({ success: true, message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating order status' });
  }
};
