const Inventory = require('../models/Inventory');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Public (for custom pizza builder & dashboard)
exports.getInventory = async (req, res) => {
  try {
    const items = await Inventory.find({});
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving inventory' });
  }
};

// @desc    Update stock of an item manually
// @route   PUT /api/inventory/:id
// @access  Private/Admin
exports.updateStock = async (req, res) => {
  try {
    const { stock, threshold } = req.body;
    
    if (stock === undefined && threshold === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide stock or threshold value' });
    }

    const updateFields = {};
    if (stock !== undefined) updateFields.stock = Number(stock);
    if (threshold !== undefined) updateFields.threshold = Number(threshold);

    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    // Access to global socket.io server to broadcast inventory updates
    if (req.app.get('socketio')) {
      req.app.get('socketio').emit('inventoryUpdate', item);
    }

    res.status(200).json({ success: true, message: 'Stock updated successfully', data: item });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ success: false, message: 'Server error updating stock' });
  }
};
