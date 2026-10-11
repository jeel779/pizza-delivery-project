const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  adminLogin,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/verify', verifyEmail);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/admin/login', adminLogin);

module.exports = router;
