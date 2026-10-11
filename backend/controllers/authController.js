const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/mailer');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_pizza_jwt_secret_key_123!', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please add all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Generate 6-digit verification OTP
    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationOTPExpires = Date.now() + 15 * 60 * 1000; // 15 mins

    // Create user (unverified)
    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      verificationOTP,
      verificationOTPExpires,
    });

    // Send verification email
    const text = `Welcome to Pizza Store! Please verify your email by entering this 6-digit OTP code on the verification page: ${verificationOTP}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <h2 style="color: #d32f2f;">Verify Your Pizza Store Account</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering. Use the following 6-digit OTP code to verify your email address. It is valid for 15 minutes:</p>
        <div style="background-color: #fff; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; border: 1px solid #ddd; margin: 20px 0; color: #333;">
          ${verificationOTP}
        </div>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Verify your Pizza Store Account',
      text,
      html,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Verification OTP sent to your email.',
      email: user.email,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Verify email using OTP
// @route   POST /api/auth/verify
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
    }

    const user = await User.findOne({
      email,
      verificationOTP: otp,
      verificationOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now login.',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Re-generate and resend OTP
      const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationOTP = verificationOTP;
      user.verificationOTPExpires = Date.now() + 15 * 60 * 1000;
      await user.save();

      await sendEmail({
        email: user.email,
        subject: 'Verify your Pizza Store Account',
        text: `Please verify your email using OTP: ${verificationOTP}`,
        html: `<h3>Please verify your email using OTP: <strong>${verificationOTP}</strong></h3>`,
      });

      return res.status(403).json({
        success: false,
        message: 'Account not verified. A new OTP has been sent to your email.',
        unverified: true,
        email: user.email,
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user registered with that email' });
    }

    // Create password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    // Reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

    const text = `You are receiving this email because you requested a password reset. Please click the link to reset your password: ${resetUrl}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <h2 style="color: #d32f2f;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password. Click the button below to reset it. This link is valid for 15 minutes:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #e65100; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If button link is not working, copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      text,
      html,
    });

    res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error during forgot password' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    // Hash the token received to compare with DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
};

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Unauthorized. Admin credentials required.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error during admin login' });
  }
};
