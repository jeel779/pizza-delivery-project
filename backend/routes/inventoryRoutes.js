const express = require('express');
const router = express.Router();
const { getInventory, updateStock } = require('../controllers/inventoryController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/', getInventory);
router.put('/:id', protect, restrictTo('admin'), updateStock);

module.exports = router;
